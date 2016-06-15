describe('duck-type', function() {
   

    describe('special support null and undefined, and self test', function () {
        it('support null', function() {
            assert(def(Object).match(null));
            assert(def({}).match(null));
        });

        it('support undefined', function() {
            assert(def(undefined).match(undefined));
            assert(!def(undefined).match({}));
            assert(!def(undefined).match(Object));
        });

        it('support self test', function() {
            assert(!def(5).match(5));

        });

    });

    describe('build-in object', function () {
        it('String', function () {
            assert(def(String).match('String'));
            assert(!def(String).match(123));
        });

        it('Number', function () {
            assert(def(Number).match(123));
            assert(!def(Number).match('123'));
        });

        it('Boolean', function () {
            assert(def(Boolean).match(true));
            assert(def(Boolean).match(false));
            assert(!def(Boolean).match(123));
            assert(!def(Boolean).match(0));
            assert(!def(Boolean).match(undefined));
        });

        it('Object', function () { 
            assert(def(Object).match({}));
            
            assert(def(Object).match([]));
            assert(def(Object).match('123'));
            assert(def(Object).match(123));
            assert(def(Object).match(true));
            assert(def(Object).match(function(){}));
        });

        it('Function', function () {
            assert(def(Function).match(function(){}));
            assert(!def(Function).match(123));
            assert(!def(Function).match(0));
        });

        it('Date', function () {
            assert(def(Date).match(new Date()));
        });

        it('Array', function () {
            assert(def(Array).match([]));
            assert(def([]).match([]));
        });

        it('RegExp', function () {
            assert(def(RegExp).match(/.*/));
        });
    });

    describe('Constructor and Prototype', function () {
        it('base', function () {
            function Person() {}
            let p = new Person();
            assert(def(Person).match(p));
            assert(!def(Person).match({}));
            assert(def(Object).match(p));
        });

        /**
        * have not implemented yet.
        */
        it('inherited by prototype chain', function () {
            function Person() {}
            function Student() {}
            Student.prototype = new Person();
            let s = new Student();
            assert(def(Student).match(s));
            assert(def(Person).match(s));
            assert(def(Object).match(s));
            assert(!def(Student).match(new Person()));
        });

        it('inherited by prototype chain, ECMAJcript6', function () {
            class Person {}
            class Student extends Person {}
            let s = new Student();
            assert(def(Student).match(s));
            assert(def(Person).match(s));
            assert(def(Object).match(s));
            assert(!def(Student).match(new Person()));
        });

        it('inherited by Object.create', function() {
            let Foo = {
                name: 'string'
            };

            let foo = Object.create(Foo);
            assert(def.asProto(Foo).match(foo));

            let bar = Object.create(foo);
            assert(def(def.asProto(Foo)).match(bar));
            assert(!def(def.asProto(Foo)).match({name:'test'}));
        })
    });

    describe('verify by callback function', function () {
        it('callback function', function() {
            assert(def.fn(x => x === 1).match(1));
            assert(!def.fn(x => x !== 1).match(1));
        });
    });

    describe('inline object define', function () {
        it('{}', function() {
            assert(def({}).match({}));
            assert(def({}).match({name:'test'}));
            assert(def({}).match(''));     
            assert(def({}).match(123));  
        });

        it('{name:String}', function() {
            assert(def({name:String}).match({name:'hello'}));       
        });

        it('{name:String, age: Number}', function() {
            assert(def({name:String, age:Number}).match({name:'hello',age:5}));       
        });

        it('{name:String, age: Number}, age missing', function() {
            assert(!def({name:String, age:Number}).match({name:'hello'}));    
        });

        it('{name:{first:String, second:String}, age: Number}', function() {
            assert(def({
                name:{
                    first:String, 
                    last:String
                }, 
                age: Number
            }).match({
                name: {
                    first: 'shen',
                    last: 'yu'
                },
                age :1
            }));

            assert(!def({
                name:{
                    first:String, 
                    last:Number
                }, 
                age: Number
            }).match({
                name: {
                    first: 'shen',
                    last: '1'
                },
                age :1
            }));
        });

        it('{name:{first:String, second:String}, age: Number, action{callback:Function}}', function() {
            assert(def({
                name:{
                    first:String, 
                    last:String
                }, 
                age: def.fn( x=> x ===1 ),
                action: {
                    callback: Function
                }
            }).match({
                name: {
                    first: 'shen',
                    last: 'yu'
                },
                age :1,
                action: {
                    callback: function(r) {}
                }
            }));

            assert(!def({
                name:{
                    first:String, 
                    last:String
                }, 
                age: def.fn( x=> x !==1 ),
                action: {
                    callback: Function
                }
            }).match({
                name: {
                    first: 'shen',
                    last: 'yu'
                },
                age :1,
                action: {
                    callback: function(r) {}
                }
            }));
        });
    });

    describe('inline array define', function () {
        it('happy path', function(){
            assert(def([]).match([]));
            assert(!def([]).match({}));            
            assert(def({}).match([]));
        });

        it('[Number],[String]',function() {
            assert(def([Number]).match([1,2,3]));
            assert(def([String]).match(['test','hello']));
            assert(def([String]).match([]));
            assert(def([Number,String,undefined]).match([1,'ok',undefined]));


            assert(!def([Number]).match([1,null,3]));
            assert(!def([String]).match(['ok',undefined,3]));
        });
    });

    describe('inline define, combine [], {}, function(){}',function() {
        it('combine [{}]', function() {
            assert(def([Number,{name:String}]).match([1,{name:'test'}]));
        });

        it('combine [{[]}]', function() {
            assert(def([Number,{name:String, list:[Number]}]).match([1,{name:'test',list:[1,2,3]}]));
        });

        it('combine {[{}]}', function() {
            assert(def({name:String, list:[{x:Number, y:Number}]}).match({name:'foo',list:[{x:10,y:20},{x:1,y:2}]}));
        });

        it('combine {function(){}}', function() {
            assert(def({name:String, age: def.fn( x=> x > 0)}).match({name:'foo', age:2, something:'test'}));
            assert(!def({name:String, age: def.fn( x=> x > 10)}).match({name:'foo', age:2, something:'test'}));
        });

        it('combine [function(){}]', function() {
            assert(def([def.fn(x => x%2 ===0 )]).match([2,4]));
            assert(!def([def.fn(x => x%2 ===0 )]).match([2,1]));
        });

        it('define type, then verify',function() {
            let _Foo = def({name:String});

            var something1 = {
                name: 'bar',
                age:123,
                resource: {
                    owner: {
                        name: 'test'
                    }
                }
            };
            var something2 = {
                age:123
            };

            assert(_Foo.match(something1));
            assert(!_Foo.match(something2));
            assert(def({resource: {owner:{name:Object}}}).match(something1));
        });
    });

    describe('type define', function () {
        it('happy path: Short', function() {
            //define type Short
            let _Short = def.fn(value => {
                return def(Number).match(value) && 
                    value % 1 === 0 &&
                    value <= 65536 &&
                    value > -65535
            });

            assert(_Short.match(1232));
        });

        it('define Customize type, and use it as properity of Object', function() {
            //define type Short
            let _Short = def.fn(value => {
                return def(Number).match(value) && 
                    value % 1 === 0 &&
                    value <= 65536 &&
                    value > -65535
            });

            let _Person = def({
                name: String,
                salary: _Short
            });

            let p1 = {
                name: 'peter',
                salary: 1234
            };

            let p2 = {
                name: 'huang',
                salary:1234567
            }

            assert(_Person.match(p1));
            assert(!_Person.match(p2));
        });

        it('Complex type define',function() {
            let _ID = def.fn(value => def(Number).match(value) && value > 0 && value % 1 === 0);
            let _Year = def.fn(value => def(Number).match(value) && value < 9999 && value >= 0);
            let _Month = def.fn(value => def(Number).match(value) && value < 12 && value >= 0);

            assert(_ID.match(123));
            assert(!_ID.match(-123));

            let _ResourceDemand = def({
                year: _Year,
                month: _Month,
                quantity: Number
            });


            let _Proposal = def({
                id: _ID,
                startDate: Date,
                endDate: Date,
                description: String,
                resourceDemands:[_ResourceDemand]
            });


            let p1 = {
                id: 12345,
                startDate: new Date(),
                endDate: new Date(),
                description: 'Please use duck-type to build your js system',
                resourceDemands:[{
                    year: 2016,
                    month:2,
                    quantity:10
                },{
                    year: 2016,
                    month:3,
                    quantity:1
                }]
            };

            assert(_Proposal.match(p1));

        });

        it('alias of Number', function() {
            let _MyNumber = def(Number);

            assert(_MyNumber.match(123));
            assert(!_MyNumber.match(true));
        });
    });

    describe('or, and, optional', function() {
        it('support or', function() {
            assert(def.or(Number,String).match(1));
            assert(def.or(Number,String).match('123'));
            assert(def.or(Number,undefined).match(123));
            assert(def.or(Number,undefined).match());
            assert(!def.or(Number,String).match(true));
        });

        it('support and',function() {
            let _Bar = def({age:Number});
            let _Foo = def({name:String});
            let _Both = def.and(_Foo,_Bar);
            
            let ok = {
                name:'hello',
                age: 123
            };

            let error1 = {name:'hello'};
            let error2 = {age:123};

            assert(_Both.match(ok));
            assert(def.and(_Foo,_Bar).match(ok));
            assert(!_Both.match(error1));
            assert(!_Both.match(error2));
        });

        it('support optional', function() {
            assert(def.opt(Number).match(1243));
            assert(def.opt(Number).match());
            assert(def({
                name:String, 
                age: def.opt(Number)
            }).match({name:'test'}));

            assert(!def({
                name:String, 
                age: def.opt(Number)
            }).match({name:'test', age:'12345'}));
        });
    });
});

describe('partially check',function() {
    let _Person = def({
        name: {first:String, last:String},
        age: Number
    });

    var name = {
        first:'foo',
        last:'bar'
    };

    assert(_Person.name.match(name));
    assert(_Person.name.first.match('test'));
    assert(_Person.age.match(123));

});

describe('parameterize',function() {
    let _Range = def.param((value,from,to) => def(Number).match(value) && value<= to && value >= from);

    assert(_Range(1,5).match(3));
    assert(!_Range(1,5).match(6));
});


describe('validate',function() {
    assert.throw(() => {
        def({
            name:String, 
            age: def.opt(Number)
        }).validate({name:123});
    })
});

describe('loop',function() {
    it('happy path 1', function() {
        let _Node = {
            name :String
        }

        _Node.next = _Node;

        let Node = def(_Node);
        let node = {
            name: 'test',
        }
        node.next = node;
        assert(Node.match(node));        
    });

    it('happy path 2', function() {
        let _Node = {
            name :String
        }

        _Node.next = _Node;

        let Node = def(_Node);
        let node1 = {
            name: 'test',
        }
        let node2 = {
            name: '2',
            next: node1
        }
        node1.next = node2;
        assert(Node.match(node1));        
    });

    it('happy path 3', function() {
        let _Node = {
            name :String
        }

        _Node.next = _Node;

        let Node = def(_Node);
        let node1 = {
            name: 'test',
        }
        let node2 = {
            name: '2',
        }
        node1.next = node2;
        node2.next = node2;
        assert(Node.match(node1));        
    });

    it('happy path 3', function() {
        let _Node = {
            name :String
        }

        _Node.next = _Node;

        let Node = def(_Node);

        let node1 = {
            name: 'test',
        }
        let node2 = {
            name: '2',
            next: node1
        }

        let node3 = {
            name: '3',
            next: node2
        }

        assert(!Node.match(node3)) 
    });

    it('happy path 4', function() {
        let _Node = {
            name :String
        }

        _Node.next = def.opt(_Node);

        let Node = def(_Node);

        let node1 = {
            name: 'test'
        }
        let node2 = {
            name: '2',
            next: node1
        }

        let node3 = {
            name: '3',
            next: node2
        }

        assert(Node.match(node3)) 
    });
});

describe('generate', function() {
    it('happy path for build in', function() {
        assert(def(String).match(def(String).random));
        assert(def(Number).match(def(Number).random));
        let v = def(Boolean).random;
        assert(def(Boolean).match(v));
        assert(def(Date).match(def(Date).random));
        assert(def(RegExp).match(def(RegExp).random));
        assert(def(Array).match(def(Array).random));
    });

    it('support []', function() {
        assert(def([]).match(def([]).random));
        assert(def([Number]).match(def([Number]).random));
        assert(def([Number,String]).match(def([Number,String]).random));
    });

    it('support {}', function() {
        let Person = def({
            name: {first:String, last:String},
            age: Number,
            skill: [String]
        });
        assert(Person.match(Person.random));
    });

    it('support constructor', function() {
        function Person() {}
        assert(def(Person).match(def(Person).random));
    });

    it('support asPrototype',function() {
        let Foo = def.asProto({
            name: 'hello',
            age: 123
        });
        assert(Foo.match(Foo.random));
    });

    it('support undefined', function() {
        assert(def(undefined).match(def(undefined).random));
    })

    it('support valiation function', function() {
        assert(def.opt(String).match(def.opt(String).random));
    });

    it('support and, or',function() {
        let X = def.or(String,Number,Date);
        assert(X.match(X.random));

        let Y = def.and({name:String}, {age:Number});
        assert(Y.match(Y.random));
    });
});



