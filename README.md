# def-schema

Define Object schema and test or validate target object. 

**Important:** Only support ECMAScript 6, both node engine and browsers.


## Getting Started 

Currently, duck-type can support both NodeJS and browser:


### Test & Validate: 


#### Example: Basic

```JavaScript

    def(String).match(123);   // return false
    def(String).match('123'); // return true
    def(String).validate(123); // throw IncompatibleTypeError if not match

```

`def` define a new `Schema` object. Use `match` to test type of target object, use `validate` to assert target object.


#### Example: Object


```
  let Person = def({name:String, age:Number});

  Person.match({name:'foo', age: 123, otherPro:'111'});   //return true
  Person.match({age:123});     //return false, missing name
  Person.match({name: 123});   //return false, name is not string

```

#### Example: Function

```JavaScript
  let Person = def({
    name: String,
    age: Number,
    sayHello: Function
  });

  let person = {
    name: 'test',
    age: 123,
    sayHello() {
      //...
    }
  };

  Person.match(person); // retrun true
```
  

#### Example: Array



```JavaScript
  
  def([]).match([1,2,'test']);  //return true
  def([Number]).match([1,2,'test']); //return false
  def([Number]).match([1,2,3]); //return true
  def[Number,String].match([1,'test']); //return true
  def[Number,String].match([1,'test',4,5]); //return true

```

#### Example: Combine Array and Object

```JavaScript
  let Person = def({
    name: String
    age: Number
    skills: [String]
  });

  let person1 = {name:'foo', age:123, skill: ['js', 'java']};
  let person2 = {name:'foo', age:123, skill: 'js'};

  Person.match(person1); //return true;
  Person.match(person2); //return false;

  def([Person]).match([person1, person2]); //return false;

```

#### Example: Customize validator


```JavaScript
  let Integer = def.fn(x => def(Number).match(x) && value % 1 === 0 && value >= -2147483648 && value <= 2147483647);

  Integer.match(123); //return true;
  Integer.match(1.23); //return false;

```

Here, by define the validate function we can decided what is 'Integer' in our program.

#### Example: Nest definition

Defined new type by leverage existing type, I mean:

```JavaScript
  let Integer = def.fn(x => def(Number).match(x) && value % 1 === 0 && value >= -2147483648 && value <= 2147483647);
  let Person = def({
    name: String,
    age: Integer
  });

  Person.match({name: 'foo', age:123}); //return true;
  Person.match({name: 'foo', age:1.23}); //return false;

});	
```

#### Example: Opertional property

```JavaScript
  let Person = def({
    name: String,
    age: def.opt(Number)
  });

  Person.match({name:'foo', age:1234}); //return true;
  Person.match({name:'foo'}); //return true;
  Person.match({name:'foo', age:'bar'}); //return false;
```

#### Example: Other buildin functions

```JavaScript
  def.or(String,Number).match('hello');  //return true;
  def.and({name:String},{age:Number}).match({name:'foo', age:123});  //return true;

  let proto = {name:String};
  let target = Object.create(proto);
  def.asProto(proto).match(target);  //return true;


  let Range = def.param( (x, from, to) => def(Number).match(x) && x >= from  && x <= to );

  Range(1,10).match(5); //return true;
  Range(1,10).match(-5); //return return false;

```

#### Example: Reuse definition partially

```JavaScript
  let Person = def({
    name: {
      first: String,
      last: String
    },
    age: Number
  });

  Person.name.match({first:'foo', last:'bar'}); //return true
  Person.name.match({first:'foo'}); //return false

```


#### Example: Generate random instance

```JavaScript
  let Person = def({
    name: String,
    age:Number
  })

  Person.random //return random instance which match definition of Person



```

Thanks :) 

