(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.cardCalculated = undefined;

var _store = require('../store');

var cardCalculated = exports.cardCalculated = (0, _store.createAction)(function (id) {
    return {
        type: 'CALCULATE_CARD',
        id: id
    };
});

},{"../store":19}],2:[function(require,module,exports){
'use strict';

var _preact = require('preact');

var _App = require('./components/App');

var _store = require('./store');

var _reducers = require('./reducers');

var _middleware = require('./middleware');

var container = document.getElementById('app');

var initState = {
    app: {
        message: ''
    },
    list: {
        cards: [{ id: 1, text: '10d6>3 + 3', isOpen: false }, { id: 2, text: '5d4kh2 - 2', isOpen: false }, { id: 3, text: '2d20 + 12 + 2', isOpen: false }, { id: 4, text: '1d20 - 3', isOpen: false }, { id: 5, text: '2d8 + 9', isOpen: false }, { id: 6, text: '2d20>5 + 4', isOpen: false }]
    }
};

(0, _store.createStore)(initState, _reducers.combinedReducer, _middleware.combinedMiddleware).subscribe(function (state) {
    console.log('render');
    (0, _preact.render)((0, _preact.h)(_App.App, state), container, container.lastChild);
});

},{"./components/App":8,"./middleware":12,"./reducers":17,"./store":19,"preact":"preact"}],3:[function(require,module,exports){
'use strict';

var _require = require('./shuntingyard'),
    shunt = _require.shunt,
    matchBrackets = _require.matchBrackets,
    checkExpression = _require.checkExpression;

var _require2 = require('./roller'),
    calculate = _require2.calculate,
    rollDice = _require2.rollDice;

var _require3 = require('../utils/either'),
    map = _require3.map,
    chain = _require3.chain,
    get = _require3.get;

var _require4 = require('ramda'),
    compose = _require4.compose;

var _require5 = require('./parser'),
    parse = _require5.parse,
    fold = _require5.fold;

var _require6 = require('./diceparser'),
    expression = _require6.expression;

var _require7 = require('../utils/logging'),
    log = _require7.log;

var calculateDice = function calculateDice(dicetext) {
    var result = compose(get, map(calculate), chain(checkExpression), map(shunt), chain(matchBrackets), map(rollDice), fold, parse(expression))(dicetext);

    return result;
};

module.exports = {
    calculateDice: calculateDice
};

},{"../utils/either":20,"../utils/logging":21,"./diceparser":4,"./parser":5,"./roller":6,"./shuntingyard":7,"ramda":"ramda"}],4:[function(require,module,exports){
'use strict';

var _require = require('./parser'),
    many = _require.many,
    many1 = _require.many1,
    sequence = _require.sequence,
    any = _require.any,
    choice = _require.choice,
    str = _require.str,
    regex = _require.regex,
    map = _require.map,
    between = _require.between,
    opt = _require.opt,
    end = _require.end,
    andThen = _require.andThen,
    setLabel = _require.setLabel,
    skip = _require.skip;

var _require2 = require('ramda'),
    compose = _require2.compose,
    merge = _require2.merge;

var _require3 = require('../utils/logging'),
    log = _require3.log;

var projectDie = function projectDie(die) {
    return {
        type: 'die',
        number: Number(die[0]),
        diceType: die[2],
        modifiers: die[3]
    };
};

var projectNumber = function projectNumber(num) {
    return {
        type: 'number',
        number: Number(num)
    };
};

var operators = {
    '^': {
        precedence: 4,
        associativity: "right",
        arity: 2
    },
    '/': {
        precedence: 3,
        associativity: "left",
        arity: 2
    },
    '*': {
        precedence: 3,
        associativity: "left",
        arity: 2
    },
    '+': {
        precedence: 2,
        associativity: "left",
        arity: 2
    },
    '-': {
        precedence: 2,
        associativity: "left",
        arity: 2
    }
};

var projectOperator = function projectOperator(op) {
    return merge({
        type: 'operator',
        operation: op
    }, operators[op]);
};

var projectBracket = function projectBracket(br) {
    return {
        type: 'bracket',
        bracket: br
    };
};

var projectWhitespace = function projectWhitespace(ws) {
    return {
        type: 'whitespace',
        whitespace: ws
    };
};

var digit = regex(/[0-9]/, 'digit');
var digits = regex(/[0-9]+/, 'digits');
var whitespace = regex(/\s+/, 'whitespace');

var betweenWhitespace = function betweenWhitespace(parser) {
    return between(opt(whitespace), parser, opt(whitespace));
};

var keep = sequence([choice([str('kh'), str('kl'), str('k')]), digits]);

var drop = sequence([choice([str('dh'), str('dl'), str('d')]), digits]);

var success = sequence([choice([str('<='), str('>='), str('<'), str('>'), str('=')]), digits]);

var reroll = sequence([choice([str('ro'), str('r')]), opt(choice([str('<='), str('>='), str('<'), str('>')])), opt(digits)]);

var modifier = choice([keep, drop, success, reroll]);

var die = compose(setLabel('die'), map(projectDie), log, betweenWhitespace, sequence)([digits, str('d'), choice([str('f'), digits]), many(modifier)]);

var num = compose(setLabel('number'), map(projectNumber), betweenWhitespace)(digits);

var operator = compose(setLabel('operator'), map(projectOperator), betweenWhitespace, choice)([str('+'), str('-'), str('*'), str('/'), str('^')]);

var bracket = compose(setLabel('bracket'), map(projectBracket), betweenWhitespace, choice)([str('('), str(')')]);

var expression = compose(many, choice)([die, num, operator, bracket]);

module.exports = {
    expression: expression
};

},{"../utils/logging":21,"./parser":5,"ramda":"ramda"}],5:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _require = require('ramda'),
    flip = _require.flip,
    reduce = _require.reduce,
    flatten = _require.flatten,
    head = _require.head,
    tail = _require.tail,
    prepend = _require.prepend,
    isEmpty = _require.isEmpty,
    curry = _require.curry,
    compose = _require.compose,
    apply = _require.apply,
    repeat = _require.repeat,
    listMap = _require.map,
    contains = _require.contains,
    join = _require.join;

var _require2 = require('../utils/either'),
    Left = _require2.Left,
    Right = _require2.Right;

//PARSER TYPE


var _Parser = function _Parser(action, label) {
    this.action = action;
    this.label = label;
};

var Parser = function Parser(action, label) {
    return new _Parser(action, label);
};

//RESULT TYPES
var _Success = function _Success(value, remaining) {
    this.value = value;
    this.remaining = remaining;
};

var Success = function Success(value, remaining) {
    return new _Success(value, remaining);
};

var _Failure = function _Failure(message, label) {
    this.message = message;
    this.label = label;
};

var Failure = function Failure(message, label) {
    return new _Failure(message, label);
};

//HELPERS
var isParser = function isParser(parser) {
    return parser instanceof _Parser;
};

var isSuccess = function isSuccess(result) {
    return result instanceof _Success;
};

var isFailure = function isFailure(result) {
    return result instanceof _Failure;
};

var parse = curry(function (parser, input) {
    return parser.action(input);
});

var fold = function fold(result) {
    return isSuccess(result) === true ? result.remaining === '' ? Right(result.value) : Left('Input remaining') : Left(result.message + '. Expected ' + result.label + '.');
};

//COMBINATORS
var of = function of(value) {
    return Parser(function (input) {
        return Success(value, input);
    });
};

var fail = function fail(message, label) {
    return Parser(function (input) {
        return Failure(message, label);
    });
};

var orElse = curry(function (parser1, parser2) {
    return Parser(function (input) {
        var result = parser1.action(input);

        if (isSuccess(result) === true) {
            return result;
        } else {
            return parser2.action(input);
        }
    }, getLabel(parser1) + ' orElse ' + getLabel(parser2));
});

var andThen = curry(function (parser1, parser2) {
    return Parser(function (input) {
        var result1 = parser1.action(input);

        if (isSuccess(result1) === true) {
            var result2 = parser2.action(result1.remaining);
            if (isSuccess(result2) === true) {
                return Success([result1.value, result2.value], result2.remaining);
            } else {
                return result2;
            }
        } else {
            return result1;
        }
    }, getLabel(parser1) + ' andThen ' + getLabel(parser2));
});

var choice = function choice(parsers) {
    return reduce(orElse, head(parsers))(tail(parsers));
};

var map = curry(function (f, parser) {
    return Parser(function (input) {
        var result = parser.action(input);

        if (isSuccess(result) === true) {
            return Success(f(result.value), result.remaining);
        } else {
            return result;
        }
    });
});

var ap = curry(function (fP, xP) {
    return compose(map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            f = _ref2[0],
            x = _ref2[1];

        return f(x);
    }), andThen)(fP, xP);
});

var apRev = flip(ap);

var lift2 = curry(function (f, xP, yP) {
    return compose(apRev(yP), apRev(xP), of)(f);
});

var chain = curry(function (f, parser) {
    return Parser(function (input) {
        var result = parser.action(input);

        if (isSuccess(result) === true) {
            var nextParser = f(result.value);
            return nextParser.action(result.remaining);
        } else {
            return result;
        }
    });
});

var consP = lift2(prepend);

var sequence = function sequence(parsers) {
    if (isEmpty(parsers) === true) {
        return of([]);
    } else {
        return consP(head(parsers), sequence(tail(parsers)));
    }
};

var sequenceMap = curry(function (maps, parsers) {
    return compose(map(apply(maps)), sequence)(parsers);
});

var zeroOrMore = function zeroOrMore(parser, input) {
    var result = parser.action(input);
    if (isSuccess(result) === true) {
        var nextResult = zeroOrMore(parser, result.remaining);
        return Success(prepend(result.value, nextResult.value), nextResult.remaining);
    } else {
        return Success([], input);
    }
};

var many = function many(parser) {
    return Parser(function (input) {
        return zeroOrMore(parser, input);
    }, 'many ' + getLabel(parser));
};

var many1 = function many1(parser) {
    return Parser(function (input) {
        var result = parser.action(input);
        if (isSuccess(result) === true) {
            return zeroOrMore(parser, input);
        } else {
            return result;
        }
    }, 'many1 ' + getLabel(parser));
};

var skip = function skip(parser1, parser2) {
    return sequenceMap(function (x, y) {
        return y;
    }, [parser1, parser2]);
};

var skipRight = function skipRight(parser1, parser2) {
    return sequenceMap(function (x, y) {
        return x;
    }, [parser1, parser2]);
};

var skipMany = function skipMany() {};

var between = function between(parser1, parser2, parser3) {
    return sequenceMap(function (x, y, z) {
        return y;
    }, [parser1, parser2, parser3]);
};

var sepBy1 = function sepBy1(match, sep) {
    return map(flatten)(andThen(match, many(skip(sep, match))));
};

var sepBy = function sepBy(match, sep) {
    return Parser(function (input) {
        var result = sepBy1(match, sep).action(input);

        if (isSuccess(result) === true) {
            return result;
        } else {
            return Success([], result.remaining);
        }
    }, sep);
};

var times = function times(min, max, parser) {
    return Parser(function (input) {
        var times = 0;
        var values = [];
        var result = void 0;
        var remaining = input;

        while (times < max) {
            result = parser.action(remaining);

            if (isSuccess(result) === true) {
                values = prepend(result.value, values);
                remaining = result.remaining;
                times += 1;
            } else if (times >= min) {
                break;
            } else {
                return result;
            }
        }

        return Success(values, remaining);
    });
};

var atMost = function atMost(upperlimit, parser) {
    return times(0, upperlimit, parser);
};

var atLeast = function atLeast(lowerlimit, parser) {
    return times(lowerlimit, Infinity, parser);
};

var opt = function opt(parser) {
    return times(0, 1, parser);
};

var lazy = function lazy(f) {
    var parser = Parser(function (input) {
        parser.action = f().action;
        return parser.action(input);
    });

    return parser;
};

var getLabel = function getLabel(parser) {
    return parser.label;
};

var setLabel = curry(function (label, parser) {
    return Parser(function (input) {
        var result = parser.action(input);

        if (isSuccess(result) === true) {
            return result;
        } else {
            return Failure(result.message, label);
        }
    }, label);
});

//PARSERS
var str = function str(_str) {
    return Parser(function (input) {
        var test = input.slice(0, _str.length);

        if (test === _str) {
            return Success(_str, input.substr(_str.length));
        } else {
            return Failure('Unexpected ' + test, _str);
        }
    }, _str);
};

var regex = function regex(regexp, label) {
    return Parser(function (input) {
        var match = input.match(regexp);

        if (match !== null && match[0] === input.substr(0, match[0].length)) {
            return Success(match[0], input.substr(match[0].length));
        } else {
            return Failure('Unexpected string from ' + regexp.source, label);
        }
    }, label);
};

var satisfy = function satisfy(pred, label) {
    return Parser(function (input) {
        var test = input.charAt(0);

        if (pred(test) === true) {
            return Success(test, input.substr(1));
        } else {
            return Failure('Unexpected ' + test, label);
        }
    });
};

var anyOf = function anyOf(chars) {
    return compose(choice, setLabel('any of'), listMap(str))(chars);
};

var noneOf = function noneOf(chars) {
    return Parser(function (input) {

        var test = input.charAt(0);

        if (!contains(test, chars)) {
            return Success(test, input.substr(1));
        } else {
            return Failure('Unexpected ' + test, 'one of ' + join(',', chars));
        }
    });
};

var end = Parser(function (input) {
    return input === '' ? Success('', '') : Failure('Unexpected ' + input, 'end of input');
});

var all = Parser(function (input) {
    return Success(input, '');
});

var any = Parser(function (input) {
    return Success(input.charAt(0), input.substr(1));
});

var lookAhead = function lookAhead(str) {
    return Parser(function (input) {
        var test = input.slice(0, str.length);

        if (test === str) {
            return Success('', input);
        } else {
            return Failure('Unexpected ' + text, str);
        }
    });
};

var lookAheadP = function lookAheadP(parser) {
    return Parser(function (input) {
        var result = parser.action(input);

        if (isSuccess(result) === true) {
            return Success('', input);
        } else {
            return Failure('Unexpected failure of lookahead', getLabel(parser));
        }
    });
};

var lookAheadRegEx = function lookAheadRegEx(regex, label) {
    var match = input.match(regexp);

    if (match !== null && match[0] === input.substr(0, match[0].length)) {
        return Success('', input);
    } else {
        return Failure('Unexpected string from ' + regex.toString(), label);
    }
};

module.exports = {
    str: str,
    regex: regex,
    satisfy: satisfy,
    anyOf: anyOf,
    noneOf: noneOf,
    end: end,
    all: all,
    any: any,
    of: of,
    fail: fail,
    orElse: orElse,
    andThen: andThen,
    choice: choice,
    sequence: sequence,
    sequenceMap: sequenceMap,
    opt: opt,
    between: between,
    sepBy: sepBy,
    sepBy1: sepBy1,
    times: times,
    atMost: atMost,
    atLeast: atLeast,
    map: map,
    many: many,
    many1: many1,
    lazy: lazy,
    skip: skip,
    skipRight: skipRight,
    skipMany: skipMany,
    lookAhead: lookAhead,
    lookAheadP: lookAheadP,
    lookAheadRegEx: lookAheadRegEx,
    ap: ap,
    lift2: lift2,
    chain: chain,
    parse: parse,
    fold: fold,
    getLabel: getLabel,
    setLabel: setLabel,
    isParser: isParser,
    isSuccess: isSuccess,
    isFailure: isFailure
};

},{"../utils/either":20,"ramda":"ramda"}],6:[function(require,module,exports){
'use strict';

var Stack = require('../utils/stack');

var _require = require('ramda'),
    compose = _require.compose,
    reduce = _require.reduce,
    unfold = _require.unfold,
    merge = _require.merge,
    map = _require.map,
    curry = _require.curry,
    join = _require.join;

var _require2 = require('../utils/either'),
    Left = _require2.Left,
    Right = _require2.Right;

var _require3 = require('../utils/logging'),
    log = _require3.log;

var add = function add(a, b) {
    return a + b;
};
var subtract = function subtract(a, b) {
    return a - b;
};
var multiply = function multiply(a, b) {
    return a * b;
};
var divide = function divide(a, b) {
    return a / b;
};
var power = function power(a, b) {
    return Math.pow(a, b);
};

var combineTopTwo = function combineTopTwo(combiner, stack) {
    var fst = Stack.peek(stack);
    stack = Stack.pop(stack);
    var snd = Stack.peek(stack);
    stack = Stack.pop(stack);

    return Stack.push(combiner(snd, fst), stack);
};

var randomFromRange = function randomFromRange(min, max) {
    return min + Math.floor(Math.random() * (max - min));
};

var calculateStep = function calculateStep(stack, step) {
    switch (step.type) {
        case 'die':
            return Stack.push(step.total, stack);
        case 'number':
            return Stack.push(step.number, stack);

        case 'operator':
            switch (step.operation) {
                case '+':
                    return combineTopTwo(add, stack);
                case '-':
                    return combineTopTwo(subtract, stack);
                case '*':
                    return combineTopTwo(multiply, stack);
                case '/':
                    return combineTopTwo(divide, stack);
                case '^':
                    return combineTopTwo(power, stack);
            }
    }
};

//calculate :: Array -> Number
var calculate = compose(Stack.peek, reduce(calculateStep, Stack.empty()));

//produceRoll :: Object -> Number -> (Boolean || [Number, Number])
var produceRoll = function produceRoll(step) {
    return function (n) {
        return n > step.number ? false : [randomFromRange(1, step.diceType), n + 1];
    };
};

//rollDie :: Object -> Object
var rollDie = function rollDie(step) {

    if (step.type === 'die') {
        console.log(step);
        //TODO: modifiers
        var values = unfold(produceRoll(step), 1);

        return merge(step, {
            values: values,
            total: reduce(add, 0, values)
        });
    } else {
        return step;
    }
};

//rollDice :: Array -> Array
var rollDice = map(rollDie);

//pad :: String -> String -> String -> String
var pad = function pad(str, padstart, padend) {
    return padstart + str + (padend || padstart);
};

//printStep :: String -> Object -> String
var printStep = function printStep(state, step) {
    switch (step.type) {
        case 'die':
            return state + pad(join(' + ', step.values), ' [ ', ' ] ');
        case 'number':
            return state + pad(step.number, ' ');
        case 'operator':
            return state + pad(step.operation, ' ');
        case 'bracket':
            return state + pad(step.bracket, ' ');
        default:
            return state;
    }
};

//print :: Array => String
var print = reduce(printStep, '');

module.exports = {
    calculate: calculate,
    rollDice: rollDice,
    print: print
};

},{"../utils/either":20,"../utils/logging":21,"../utils/stack":22,"ramda":"ramda"}],7:[function(require,module,exports){
'use strict';

var Stack = require('../utils/stack');

var _require = require('ramda'),
    map = _require.map,
    reduce = _require.reduce,
    reduced = _require.reduced,
    compose = _require.compose,
    curry = _require.curry,
    prop = _require.prop,
    append = _require.append;

var _require2 = require('../utils/either'),
    Left = _require2.Left,
    Right = _require2.Right;

var removeOperators = function removeOperators(pred, output, operators) {
    while (pred(operators)) {
        output = append(Stack.peek(operators), output);
        operators = Stack.pop(operators);
    }

    return {
        output: output,
        operators: operators
    };
};

var testPrecedence = curry(function (op, operators) {
    return op.associativity === 'left' && op.precedence <= Stack.peek(operators).precedence || op.precedence < Stack.peek(operators).precedence;
});

var notOpeningBracket = function notOpeningBracket(operators) {
    return Stack.peek(operators).bracket !== '(';
};

var notEmpty = function notEmpty(operators) {
    return Stack.isEmpty(operators) === false;
};

var shunter = function shunter(_ref, token) {
    var output = _ref.output,
        operators = _ref.operators;

    if (token.type === 'number' || token.type === 'die') {
        return {
            output: append(token, output),
            operators: operators
        };
    } else if (token.type === 'operator') {
        var state = removeOperators(testPrecedence(token), output, operators);
        return {
            output: state.output,
            operators: Stack.push(token, state.operators)
        };
    } else if (token.type === 'bracket') {
        if (token.bracket === '(') {
            return {
                output: output,
                operators: Stack.push(token, operators)
            };
        } else if (token.bracket === ')') {
            var _state = removeOperators(notOpeningBracket, output, operators);
            return {
                output: _state.output,
                operators: Stack.pop(_state.operators)
            };
        }
    }
};

var shuntState = {
    output: [],
    operators: Stack.empty()
};

var appendRemaining = function appendRemaining(_ref2) {
    var output = _ref2.output,
        operators = _ref2.operators;
    return removeOperators(notEmpty, output, operators);
};

//shunt :: Array -> Queue
var shunt = function shunt(tokens) {
    return compose(prop('output'), appendRemaining, reduce(shunter, shuntState))(tokens);
};

//decrementCounter :: Integer -> Integer -> Integer
var decrementCounter = function decrementCounter(counter, by) {
    counter = counter - by;

    if (counter < 0) {
        return reduced(counter);
    } else {
        return counter + 1;
    }
};

//checkStep :: Integer -> Object -> Integer
var checkStep = function checkStep(counter, step) {
    switch (step.type) {
        case 'die':
        case 'number':
            return counter + 1;
        case 'operator':
            if (step.arity === 2) {
                return decrementCounter(counter, 2);
            } else if (step.arity === 1) {
                return decrementCounter(counter, 1);
            }
    }
};

//checkExpression :: Array -> Either Array String
var checkExpression = function checkExpression(steps) {
    return reduce(checkStep, 0, steps) === 1 ? Right(steps) : Left('Invalid Expression');
};

//countBracket :: Object -> Object
var countBracket = function countBracket(state, step) {
    return {
        open: state.open + (step.type === 'bracket' && step.bracket === '(' ? 1 : 0),
        close: state.close + (step.type === 'bracket' && step.bracket === ')' ? 1 : 0)
    };
};

//hasEqualBrackets:: Object -> Boolean
var hasEqualBrackets = function hasEqualBrackets(brackets) {
    return brackets.open === brackets.close;
};

//matchBrackets :: Array -> Either Array String
var matchBrackets = function matchBrackets(steps) {
    return compose(hasEqualBrackets, reduce(countBracket, {
        open: 0,
        close: 0
    }))(steps) ? Right(steps) : Left('Brackets don\'t match');
};

module.exports = {
    shunt: shunt,
    checkExpression: checkExpression,
    matchBrackets: matchBrackets
};

},{"../utils/either":20,"../utils/stack":22,"ramda":"ramda"}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
   value: true
});
exports.App = undefined;

var _preact = require('preact');

var _list = require('./pages/list');

var App = exports.App = function App(state) {
   return (0, _preact.h)(
      'div',
      null,
      (0, _preact.h)(_list.ListPage, { cards: state.list.cards })
   );
};

},{"./pages/list":11,"preact":"preact"}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Card = undefined;

var _preact = require('preact');

var _cards = require('../../actions/cards');

var cardClicked = function cardClicked(card) {
    return function (e) {
        console.log(e);
        (0, _cards.cardCalculated)(card.id);
    };
};

var Card = exports.Card = function Card(_ref) {
    var card = _ref.card;
    return (0, _preact.h)(
        'div',
        { className: 'card-stack--card' },
        (0, _preact.h)(
            'div',
            { className: 'card-stack--card-details', onClick: cardClicked(card) },
            (0, _preact.h)(
                'div',
                { className: 'card-stack--card-text' },
                card.text
            ),
            (0, _preact.h)(
                'div',
                { className: 'card-stack--card-result' },
                card.result
            )
        )
    );
};

},{"../../actions/cards":1,"preact":"preact"}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CardStack = undefined;

var _preact = require('preact');

var _Card = require('./Card');

var _ramda = require('ramda');

var createCard = function createCard(card) {
    return (0, _preact.h)(_Card.Card, { card: card });
};

var CardStack = exports.CardStack = function CardStack(_ref) {
    var cards = _ref.cards;
    return (0, _preact.h)(
        'div',
        { className: 'card-stack' },
        (0, _ramda.map)(createCard)(cards)
    );
};

},{"./Card":9,"preact":"preact","ramda":"ramda"}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ListPage = undefined;

var _preact = require('preact');

var _cardStack = require('../cards/card-stack');

var ListPage = exports.ListPage = function ListPage(_ref) {
    var cards = _ref.cards;

    return (0, _preact.h)(_cardStack.CardStack, { cards: cards });
};

},{"../cards/card-stack":10,"preact":"preact"}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.combinedMiddleware = undefined;

var _store = require('../store');

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _validator = require('./validator');

var _validator2 = _interopRequireDefault(_validator);

var _task = require('./task');

var _task2 = _interopRequireDefault(_task);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var combinedMiddleware = exports.combinedMiddleware = (0, _store.combineMiddleware)([_logger2.default, _validator2.default, _task2.default]);

},{"../store":19,"./logger":13,"./task":14,"./validator":15}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _rxjs = require('rxjs');

var logger = function logger(action) {
    console.log(action);
    return _rxjs.Observable.of(action);
};

exports.default = logger;

},{"rxjs":"rxjs"}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _rxjs = require('rxjs');

var _task = require('../utils/task');

var task = function task(action) {
    var task = action.task;


    if (task === undefined) {
        return _rxjs.Observable.of(action);
    }

    var computation = task.computation,
        computing = task.computing,
        success = task.success,
        failure = task.failure;


    var taskRunner = _rxjs.Observable.create(function (observer) {

        observer.next(computing());

        (0, _task.fork)(function (error) {
            observer.next(failure(error));
            observer.complete();
        }, function (data) {
            observer.next(success(data));
            observer.complete();
        }, computation);
    });

    return taskRunner;
};

exports.default = task;

},{"../utils/task":23,"rxjs":"rxjs"}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _rxjs = require('rxjs');

var _ramda = require('ramda');

var validator = function validator(action) {
  var validate = action.validate;


  if (validate === undefined) {
    return _rxjs.Observable.of(action);
  }

  var rules = validate.rules,
      _validate$data = validate.data,
      data = _validate$data === undefined ? {} : _validate$data,
      success = validate.success,
      failure = validate.failure,
      reset = validate.reset;


  var apply = function apply(rules) {
    return function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          key = _ref2[0],
          value = _ref2[1];

      var messages = (0, _ramda.compose)((0, _ramda.reject)(_ramda.isNil), (0, _ramda.map)(function (rule) {
        return rule.validator(value) === false ? rule.message : undefined;
      }))(rules[key]);
      return messages.length > 0 ? [key + 'Errors', messages] : undefined;
    };
  };

  var errors = (0, _ramda.compose)(_ramda.fromPairs, (0, _ramda.reject)(_ramda.isNil), (0, _ramda.map)(apply(rules)), _ramda.toPairs, (0, _ramda.pick)((0, _ramda.keys)(rules)))(data);

  if (Object.keys(errors).length === 0) {
    return _rxjs.Observable.merge(_rxjs.Observable.of(reset(data)), _rxjs.Observable.of(success(data)));
  } else {
    return _rxjs.Observable.of(failure(data, errors));
  }
};

exports.default = validator;

},{"ramda":"ramda","rxjs":"rxjs"}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = function (state, action) {
  switch (action.type) {
    case 'SEND_MESSAGE_APP_SUCCESS':
      return _extends({}, state, {
        message: action.data
      });

    case 'SEND_MESSAGE_APP_FAILURE':
      return _extends({}, state, {
        message: action.errors.titleErrors[0]
      });

    default:
      return state;
  }
};

},{}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combinedReducer = undefined;

var _store = require('../store');

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

var _list = require('./list');

var _list2 = _interopRequireDefault(_list);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var combinedReducer = exports.combinedReducer = (0, _store.combineReducers)({
  app: _app2.default,
  list: _list2.default
});

},{"../store":19,"./app":16,"./list":18}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ramda = require('ramda');

var _calculator = require('../calculator/calculator');

var calculateCard = function calculateCard(id) {
  return function (card) {
    return id === card.id ? (0, _ramda.merge)(card, { result: (0, _calculator.calculateDice)(card.text) }) : card;
  };
};

exports.default = function (state, action) {
  switch (action.type) {
    case 'CALCULATE_CARD':
      return (0, _ramda.merge)(state, {
        cards: (0, _ramda.map)(calculateCard(action.id))(state.cards)
      });

    default:
      return state;
  }
};

},{"../calculator/calculator":3,"ramda":"ramda"}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combineMiddleware = exports.combineReducers = exports.createAction = exports.createStore = exports.isObservable = undefined;

var _rxjs = require('rxjs');

var _ramda = require('ramda');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var action$ = new _rxjs.Subject();

var isObservable = exports.isObservable = function isObservable(obj) {
  return obj instanceof _rxjs.Observable;
};

var createStore = exports.createStore = function createStore(initstate, reducers, middlewares) {
  return action$.startWith(initstate).scan(reducers);
};

var createAction = exports.createAction = function createAction(func) {
  return function () {
    var action = func.apply(undefined, arguments);
    action$.next(action);

    return action;
  };
};

var updateState = function updateState(reducers, action) {
  return function (state, key) {
    return reducers[key](state, action);
  };
};

var combineReducers = exports.combineReducers = function combineReducers(reducers) {
  return function (state, action) {
    return (0, _ramda.mapObjIndexed)(updateState(reducers, action), state);
  };
};

var combineMiddleware = exports.combineMiddleware = function combineMiddleware(middlewares) {
  return function (action) {
    return _rxjs.Observable.merge.apply(_rxjs.Observable, _toConsumableArray((0, _ramda.map)(function (middleware) {
      return middleware(action);
    })(middlewares)));
  };
};

},{"ramda":"ramda","rxjs":"rxjs"}],20:[function(require,module,exports){
"use strict";

var _Left = function _Left(a) {
    this.value = a;
};

var Left = function Left(a) {
    return new _Left(a);
};

var _Right = function _Right(a) {
    this.value = a;
};

var Right = function Right(a) {
    return new _Right(a);
};

var isLeft = function isLeft(either) {
    return either instanceof _Left;
};

var isRight = function isRight(either) {
    return either instanceof _Right;
};

var fromNullable = function fromNullable(a) {
    return a !== null ? Right(a) : Left(a);
};

var of = function of(a) {
    return Right(a);
};

var ap = function ap(b) {
    return function (either) {
        return isLeft(either) ? either : map(b, either.value);
    };
};

var map = function map(f) {
    return function (either) {
        return of(f(either.value));
    };
};

var chain = function chain(f) {
    return function (either) {
        return isLeft(either) ? function () {} : f(either.value);
    };
};

var get = function get(either) {
    return isRight(either) ? either.value : undefined;
};

var getOrElse = function getOrElse(value) {
    return function (either) {
        return isRight(either) ? either.value : value;
    };
};

var merge = function merge(either) {
    return either.value;
};

var fold = function fold(f, g) {
    return function (either) {
        return isRight(either) ? g(either.value) : f(either.value);
    };
};

module.exports = {
    Left: Left,
    Right: Right,
    isLeft: isLeft,
    isRight: isRight,
    fromNullable: fromNullable,
    of: of,
    map: map,
    chain: chain,
    get: get,
    getOrElse: getOrElse,
    merge: merge,
    fold: fold
};

},{}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var log = exports.log = function log(item) {
    console.log(item);
    return item;
};

},{}],22:[function(require,module,exports){
"use strict";

var _Stack = function _Stack(item, stack) {
    this.head = item;
    this.tail = stack;
};

var _Empty = function _Empty() {};

var Stack = function Stack(item, stack) {
    return new _Stack(item, stack);
};

var Empty = new _Empty();

var push = function push(item, stack) {
    return Stack(item, stack);
};

var pop = function pop(stack) {
    return stack.tail === undefined ? Stack(Empty) : stack.tail;
};

var peek = function peek(stack) {
    return stack.head;
};

var empty = function empty() {
    return Stack(Empty);
};

var isEmpty = function isEmpty(stack) {
    return stack.head === undefined || stack.head instanceof _Empty;
};

var reverse = function reverse(stack) {
    var reverseStack = empty();

    while (!isEmpty(stack)) {
        reverseStack = push(peek(stack), reverseStack);
        stack = pop(stack);
    }

    return reverseStack;
};

module.exports = {
    push: push,
    pop: pop,
    peek: peek,
    empty: empty,
    isEmpty: isEmpty,
    reverse: reverse
};

},{}],23:[function(require,module,exports){
"use strict";

var _Task = function _Task(computation) {
    this.computation = computation;
};

var Task = function Task(computation) {
    return new _Task(computation);
};

var of = function of(value) {
    return Task(function (_, resolve) {
        return resolve(value);
    });
};

var rejected = function rejected(value) {
    return Task(function (reject) {
        return reject(value);
    });
};

var map = function map(f, task) {
    return Task(function (reject, resolve) {
        return fork(function (a) {
            return reject(a);
        }, function (b) {
            return resolve(f(b));
        }, task);
    });
};

var chain = function chain(f, task) {
    return Task(function (reject, resolve) {
        return fork(function (a) {
            return reject(a);
        }, function (b) {
            return fork(reject, resolve, f(b));
        }, task);
    });
};

var ap = function ap(taskf, taskx) {
    return Task(function (reject, resolve) {
        var value = void 0;
        var valueSet = false;
        var func = void 0;
        var funcSet = false;

        var resolver = function resolver(setter) {
            return function (x) {
                setter(x);
                if (valueSet === true && funcSet === true) {
                    return resolve(func(value));
                }
            };
        };

        var statex = fork(reject, resolver(function (x) {
            value = x;
            valueSet = true;
        }), taskx);

        var statef = fork(reject, resolver(function (f) {
            func = f;
            funcSet = true;
        }), taskf);

        return [statex, statef];
    });
};

var concat = function concat(concattask, task) {
    return Task(function (reject, resolve) {
        var state = fork(reject, resolve, task);
        var stateconcat = fork(reject, resolve, taskconcat);

        return [state, stateconcat];
    });
};

var empty = function empty() {
    return Task(function () {});
};

var fold = function fold(f, g, task) {
    return Task(function (_, resolve) {
        return fork(function (a) {
            return resolve(f(a));
        }, function (b) {
            return resolve(g(b));
        });
    }, task);
};

var cata = function cata(pattern, task) {
    return fold(pattern.rejected, pattern.resolved, task);
};

var bimap = function bimap(f, g) {
    return Task(function (reject, resolve) {
        return fork(function (a) {
            return reject(f(a));
        }, function (b) {
            return resolve(g(b));
        });
    }, task);
};

var fork = function fork(reject, resolve, task) {
    console.log(task.computation);
    return task.computation(reject, resolve);
};

module.exports = {
    Task: Task,
    of: of,
    rejected: rejected,
    map: map,
    chain: chain,
    ap: ap,
    concat: concat,
    empty: empty,
    fold: fold,
    cata: cata,
    bimap: bimap,
    fork: fork
};

},{}]},{},[2])

//# sourceMappingURL=app.js.map
