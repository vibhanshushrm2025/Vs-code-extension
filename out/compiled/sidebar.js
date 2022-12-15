var app = (function () {
    'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    /* webviews\components\Sidebar.svelte generated by Svelte v3.51.0 */

    function create_fragment(ctx) {
    	let form;
    	let div0;
    	let input;
    	let t0;
    	let br;
    	let t1;
    	let button0;
    	let t3;
    	let div1;
    	let t5;
    	let button1;
    	let t7;
    	let button2;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			form = element("form");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Get Questions";
    			t3 = space();
    			div1 = element("div");
    			div1.textContent = "No questions to display ......Enter contest id";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Next →";
    			t7 = space();
    			button2 = element("button");
    			button2.textContent = "← Previous";
    			attr(input, "type", "text");
    			attr(input, "placeholder", "Contest ID");
    			attr(input, "id", "ii");
    			attr(button0, "type", "submit");
    			attr(button0, "id", "hn");
    			attr(div0, "id", "hj");
    			attr(div1, "id", "hh");
    			attr(button1, "id", "next");
    			attr(button2, "id", "prev\r\nious");
    		},
    		m(target, anchor) {
    			insert(target, form, anchor);
    			append(form, div0);
    			append(div0, input);
    			append(div0, t0);
    			append(div0, br);
    			append(div0, t1);
    			append(div0, button0);
    			insert(target, t3, anchor);
    			insert(target, div1, anchor);
    			insert(target, t5, anchor);
    			insert(target, button1, anchor);
    			insert(target, t7, anchor);
    			insert(target, button2, anchor);

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", /*re*/ ctx[2]),
    					listen(button1, "click", /*ne*/ ctx[1]),
    					listen(button2, "click", /*pre*/ ctx[0])
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(form);
    			if (detaching) detach(t3);
    			if (detaching) detach(div1);
    			if (detaching) detach(t5);
    			if (detaching) detach(button1);
    			if (detaching) detach(t7);
    			if (detaching) detach(button2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance($$self) {
    	let gh;
    	let i = 0;

    	async function pre() {
    		if (i != 0) {
    			i--;
    			let c = i + 1;
    			let fi = document.getElementById(String(c));
    			fi.style.display = "none";
    			let se = document.getElementById(String(i));
    			se.style.removeProperty('display');
    		}
    	}

    	async function ne() {
    		if (i != gh.length - 1) {
    			i++;
    			let c = i - 1;
    			let fi = document.getElementById(String(c));
    			fi.style.display = "none";
    			let se = document.getElementById(String(i));
    			se.style.removeProperty('display');
    		}
    	}

    	async function re(e) {
    		e.preventDefault();
    		i = 0;
    		let x = document.getElementById("hh");
    		x.innerHTML = "";
    		x.innerHTML = "Loading....";
    		let element = document.getElementById("hn");
    		element.setAttribute("disabled", "true");
    		let n = document.getElementById("ii").value;
    		console.log(n);
    		var s = `https://webscrape-cf-qs.onrender.com/contests/${n}`;
    		var response = await fetch(s);
    		console.log("hy");
    		const data = await response.text();
    		gh = JSON.parse(data);
    		element.removeAttribute("disabled");
    		console.log(gh.length);
    		console.log(gh);
    		x.innerHTML = "";

    		for (let j = 0; j < gh.length; j++) {
    			let y = document.createElement("div");
    			x.appendChild(y);
    			y.setAttribute("id", String(j));

    			if (j != 0) {
    				y.style.display = "none";
    			}

    			y.innerHTML = "";
    			let arri = gh[j]["example"]["input"];
    			let arro = gh[j]["example"]["output"];
    			let si = arro.length;
    			let t = "sq" + j;
    			y.innerHTML = `<span>Total no. of questions : ${gh.length}</span><br><button disabled>Question Number : ${j + 1}</button><br><h1>${gh[j].title}</h1><br><span>INPUT : ${gh[j]["input-file"]}</span><br><span>OUTPUT : ${gh[j]["output-file"]}</span><br><span>TIME - LIMIT : ${gh[j]["time-limit"]}</span><br><span>MEMORY - LIMIT : ${gh[j]["memory-limit"]}</span><br><br><h2>Q.</h2><h3>${gh[j].question}</h3><br><h2 id=${t}>Sample I/O</h2></h3><br><h2>Input:</h2><h3>${gh[j]["input-specification"]}</h3><br><h2>Output:</h2><h3>${gh[j]["output-specification"]}</h3><br><h2>Note:</h2><h3>${gh[j].note}</h3>`;
    			let r = document.getElementById(t);

    			for (let jk = 0; jk < si; jk++) {
    				let nd = document.createElement('div');
    				r.appendChild(nd);
    				nd.innerHTML = `<h5>${jk + 1}.</h5>          <h5>Input :${arri[jk]}</h5><h5>Output : ${arri[jk]}</h5>`;
    			}
    		}

    		MathJax.Hub.Config({
    			tex2jax: {
    				inlineMath: [["$$$", "$$$"]],
    				displayMath: [["$$$$$$", "$$$$$$"]]
    			}
    		});

    		MathJax.Hub.Configured();
    		MathJax.Hub.Typeset();
    	}

    	return [pre, ne, re];
    }

    class Sidebar extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    const app = new Sidebar({
        target: document.body,
    });

    return app;

})();
//# sourceMappingURL=sidebar.js.map
