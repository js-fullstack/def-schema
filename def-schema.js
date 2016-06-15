(function defSchema () {
	let __turnoff = false;

	const WORD_LEN = 10, MAX_NUM = 20000, ARRAY_LEN = 10;

	const UNDEFINED = Symbol('undefined');

	const STRING_POOL = new Set(defSchema.toString().match(/[\w]*/g).filter(x => x !== ''));

	const CONTEXT = { 

		isTopCallStack: true,

		init() {
			this.paths = [];
			this.problems = new Map();
			this.isFinished = false;
			this.isTopCallStack = false;
		},

		cleanup() {
			this.paths = undefined;
			this.problems = undefined;
			this.isFinished = false;
			this.isTopCallStack = true;
		},

		saveLatestMatch(target, def) {
			this.latestMatch = {
				def: def,
				target: target
			}
		},

		runWith (targetPropertyName, defPropertyName, targetObj, defObj, fn) {
			if(this.problems.get(targetObj) === defObj) {
				return true;
			}

			this.problems.set(targetObj, defObj);

			this.paths.push({
				def: defPropertyName,
				target: targetPropertyName
			});

			let result =  fn();
			if(!this.isFinished && !result) {
				this.latestPath = this.paths.slice();
				this.isFinished = true;
			}
			this.paths.pop();
			return result;
		}
	};

	const BUILDIN_GENERATORS = (() => {

		let result = new Map();

		result.set(String, () => {
			let from = _randomInt(STRING_POOL.size);
			let to = Math.min(STRING_POOL.size,from + _randomInt(WORD_LEN));
			return [...STRING_POOL].slice(from,to).map( x => x[0].toUpperCase() + x.slice(1)).join(' ');
		});

		result.set(Number, () => (Math.random() - 0.5)* MAX_NUM);
		result.set(Boolean, () => Math.random() >= 0.5? true: false);
		result.set(Date, () => new Date(_randomInt(new Date().getTime())));
		result.set(Object, () => {
			return result.get(([...result.keys()].filter(x => x !== Array))[_randomInt(result.size - 1)])();
		});
		result.set(Function,(name) => function (...args) {
			console.log(`function ${name} was called by argements: ${args}`);
		});
		result.set(Array, ()=> {
			return new Array(_randomInt(ARRAY_LEN)).fill(undefined).map(() => result.get(Object)());
		});
		result.set(RegExp, () => /.*/ );
		return result;
	})();

	const TYPE = {

		UNDEFINED: {
			match(target, definition) {
				return target === undefined;
			},
			generate() {
				return undefined;
			}
		}, 

		VALIDATOR: {
			match(target, validationFn) {
				return validationFn(target)? true : false;
			},
			generate({generatorFn}) {
				if(generatorFn !== undefined) {
					return generatorFn();	
				}
			}
		},
		CLASS: {
			match(target, clazz) {
				CONTEXT.saveLatestMatch(target, clazz.name);
				return target !== undefined && new Object(target) instanceof clazz;
			},
			generate({definition}) {
				if(BUILDIN_GENERATORS.has(definition)) {
					return BUILDIN_GENERATORS.get(definition)();
				} else {
					return new definition();
				}
			}
		},
		ARRAY: {
			match(targetArray, defArray) {
				if(!Array.isArray(targetArray)) {
					return false;
				}

				switch(defArray.length) {
					case 0:
						return true;
					case 1:
						return targetArray.every((e,i) => {
							return CONTEXT.runWith(`[${i}]`, '[0]', e, defArray[0], () => def(defArray[0]).match(e));
						});
					default:
						return defArray.every((e,i) => { 
							return CONTEXT.runWith(`[${i}]`, `[${i}]`, targetArray[i], e, () => {
								return def(e).match(targetArray[i])
							});
						});
				}
			},
			generate({definition}) {
				return (() => {
					switch(definition.length) {
						case 0:
							return BUILDIN_GENERATORS.get(Array)();
						case 1:
							return new Array(_randomInt(ARRAY_LEN)).fill(null).map(() => def(definition[0]).random);
						default:
							return new Array(definition.length).fill(null).map((x, i) => def(definition[i]).random);
					}
				})();
			}
		},
		OBJECT: {
			match(targetObj, defObj){
				return TYPE.CLASS.match(targetObj, Object) 
					&& Object.keys(defObj).every(property => { 
						return	CONTEXT.runWith(`.${property}`, `.${property}`, targetObj[property], defObj[property], () => {
							return def(defObj[property]).match(targetObj[property]);
						});
				});
			},
			generate({definition}) {
				return Object.keys(definition).reduce((tmp, key)=> {
					tmp[key] = def(definition[key]).random
					return tmp;
				} ,{});
			}
		},
		UNSUPPORTED : {
			match() { return false; },
			generate() { return undefined; }
		}
	};

	class IncompatibleTypeError extends Error {
		constructor() {
			let [defPath, targetPath] = (CONTEXT.latestPath||[]).reduce(([def, target],cur) => {
					def.push(cur.def);
					target.push(cur.target);
					return [def, target];
				},[[], []]).map(array => array.join(''));

			let {target,def} = CONTEXT.latestMatch;
			def = Array.isArray(def)?'Array': def;
			def = def === UNDEFINED? 'undefined': def;

			super(`${target} doesn't match ${def}, reference: <obj>${targetPath}`);

			this.faildMatch = CONTEXT.latestMatch;
			this.paths = CONTEXT.latestPath;
			this.stack = this.stack.split(/\n/).filter(msg => !msg.includes('def-schema.js')).join('\n');
		}
	}

	class Schema {
		constructor(definition = UNDEFINED) {
			if(TYPE.CLASS.match(definition, Schema)) {
				return definition;
			} else {
				this.__def = definition;	
			}
		}

		match(target) {
			let isTopCallStack = false;
	
			if(CONTEXT.isTopCallStack) {
				CONTEXT.init();
				isTopCallStack = true;
			}

			try {
				CONTEXT.saveLatestMatch(target, this.__def);
				return this.__detect().match(target, this.__def);
			} finally {
				if(isTopCallStack) {
					CONTEXT.cleanup();
				}
			}
		}

		validate(target) {
			if(__turnoff) {
				return;
			}
			if(!this.match(target)) {
				throw new IncompatibleTypeError();
			}
		}

		get random() {
			return this.__detect().generate({definition:this.__def, generatorFn: this.__def_generator_fn});
			let definition = this.__def;
		}

		__detect() {
			if(this.__def === UNDEFINED) {
				return TYPE.UNDEFINED;
			} else if(typeof(this.__def) === 'function') {
				if(this.__def_fn) {
					return TYPE.VALIDATOR;
				} else {
					return TYPE.CLASS;
				}
			} else if(Array.isArray(this.__def)){
				return TYPE.ARRAY;
			} else if(this.__def instanceof Object) {
				return TYPE.OBJECT;
			} else {
				return TYPE.UNSUPPORTED;
			}
		}
	}


	function def(definition) {
		return new Proxy(new Schema(definition),{
			get(target, key) {
				if(Reflect.has(target, key)) {
					return target[key]; 
				} else if(definition === undefined) {
					return undefined;
				} else if(Reflect.has(definition, key)) {
					return def(definition[key]);
				} else {
					return undefined;
				}
			}
		});
	}

	Object.assign(def, {
		turnoff() {
			__turnoff = true;
		},
		fn(validationFn, generatorFn) {
			let result = def(validationFn);
			result.__def_generator_fn = generatorFn;
			result.__def_fn = true;
			return result;
		},
		or(...args) {
			return this.fn(
				x  => args.some(arg => def(arg).match(x)),
				() => def(args[_randomInt(args.length)]).random
			);
		},
		and(...args) {
			return this.fn(
				x => args.every(arg => def(arg).match(x)),
				() => Object.assign(...args.map(arg => def(arg).random))
			);
		},
		asProto(prototype) {
			return this.fn( 
				x => prototype.isPrototypeOf(x),
				() => Object.create(prototype)
			);
		},
		param(fn) {
			return (...args) => {
				return this.fn( x => fn(...[x].concat(args)));
			}
		},
		opt(definition) {
			return this.or(definition, undefined);
		}
	});

	function _randomInt(n) {
 	   return Math.floor(Math.random() * n);
	}	

	/***************** export **********/
	/**
	* CommonJS module exports
	*/
	if ((typeof module !== 'undefined') && (typeof module.exports !== 'undefined')) {
		module.exports = def;
	}

	if (typeof exports !== 'undefined') {
		exports = def;
	}

	// AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return def;
        });
    }

	/**
	* Browser exports
	*/
	if (typeof(window)  !== 'undefined') {
		window.def = def;
	}
})();