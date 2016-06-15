let def = require('./def-schema');

//def(Number).validate('12345');  


//def({abc:{bbb:[Number,String]}}).validate({ abc:{ bbb:[123,22] }});  

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

//Node.validate(node3);

console.log(def({
	title: String,
	birthday: Date,
	skills:[String]
}).random);

let A = def([Number,String]);

 let Person = def({
    name: {first:String, last:String},
    age: Number,
    skill: [String]
});

console.log('---->',def.and({name:String},{age:Number}).random)


