define("metaphorjs-watchable", ['metaphorjs-observable'], function(Observable) {


/**
 * @returns {String}
 */
var nextUid = function(){
    var uid = ['0', '0', '0'];

    // from AngularJs
    return function() {
        var index = uid.length;
        var digit;

        while(index) {
            index--;
            digit = uid[index].charCodeAt(0);
            if (digit == 57 /*'9'*/) {
                uid[index] = 'A';
                return uid.join('');
            }
            if (digit == 90  /*'Z'*/) {
                uid[index] = '0';
            } else {
                uid[index] = String.fromCharCode(digit + 1);
                return uid.join('');
            }
        }
        uid.unshift('0');
        return uid.join('');
    };
}();

var toString = Object.prototype.toString;
var isObject = function(value) {
    return value != null && typeof value === 'object';
};
var isNumber = function(value) {
    return typeof value == "number" && !isNaN(value);
};


/**
 * @param {*} value
 * @returns {boolean}
 */
var isArray = function(value) {
    return !!(value && isObject(value) && isNumber(value.length) &&
                toString.call(value) == '[object Array]' || false);
};

var isDate = function(value) {
    return toString.call(value) === '[object Date]';
};
var isFunction = function(value) {
    return typeof value === 'function';
};


var isRegExp = function(value) {
    return toString.call(value) === '[object RegExp]';
};
var isWindow = function(obj) {
    return obj && obj.document && obj.location && obj.alert && obj.setInterval;
};
var isString = function(value) {
    return typeof value == "string";
};


/**
 * @param {String} value
 */
var trim = function() {
    // native trim is way faster: http://jsperf.com/angular-trim-test
    // but IE doesn't have it... :-(
    if (!String.prototype.trim) {
        return function(value) {
            return isString(value) ? value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : value;
        };
    }
    return function(value) {
        return isString(value) ? value.trim() : value;
    };
}();

var emptyFn = function(){};

var slice = Array.prototype.slice;
var strUndef = "undefined";


var isUndefined = function(any) {
    return typeof any == strUndef;
};





return function(){

    

    var REG_REPLACE_EXPR = /(^|[^a-z0-9_$])(\.)([^0-9])/ig,

        isStatic    = function(val) {

            if (!isString(val)) {
                return true;
            }

            var first   = val.substr(0, 1),
                last    = val.length - 1;

            if (first == '"' || first == "'") {
                if (val.indexOf(first, 1) == last) {
                    return val.substring(1, last);
                }
            }

            return false;
        },

        copy    = function(source, destination){
            if (isWindow(source)) {
                throw new Error("Cannot copy window object");
            }

            if (!destination) {
                destination = source;
                if (source) {
                    if (isArray(source)) {
                        destination = copy(source, []);
                    } else if (isDate(source)) {
                        destination = new Date(source.getTime());
                    } else if (isRegExp(source)) {
                        destination = new RegExp(source.source);
                    } else if (isObject(source)) {
                        destination = copy(source, {});
                    }
                }
            } else {
                if (source === destination) {
                    throw new Error("Objects are identical");
                }
                if (isArray(source)) {
                    destination.length = 0;
                    for ( var i = 0; i < source.length; i++) {
                        destination.push(copy(source[i]));
                    }
                } else {
                    var key;
                    for (key in destination) {
                        delete destination[key];
                    }
                    for (key in source) {
                        destination[key] = copy(source[key]);
                    }
                }
            }
            return destination;
        },

        equals  = function(o1, o2) {
            if (o1 === o2) return true;
            if (o1 === null || o2 === null) return false;
            if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
            var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
            if (t1 == t2) {
                if (t1 == 'object') {
                    if (isArray(o1)) {
                        if (!isArray(o2)) return false;
                        if ((length = o1.length) == o2.length) {
                            for(key=0; key<length; key++) {
                                if (!equals(o1[key], o2[key])) return false;
                            }
                            return true;
                        }
                    } else if (isDate(o1)) {
                        return isDate(o2) && o1.getTime() == o2.getTime();
                    } else if (isRegExp(o1) && isRegExp(o2)) {
                        return o1.toString() == o2.toString();
                    } else {
                        if (isWindow(o1) || isWindow(o2) || isArray(o2)) return false;
                        keySet = {};
                        for(key in o1) {
                            if (key.charAt(0) === '$' && typeof o1[key] == "object") {
                                continue;
                            }
                            if (isFunction(o1[key])) {
                                continue;
                            }
                            if (!equals(o1[key], o2[key])) {
                                return false;
                            }
                            keySet[key] = true;
                        }
                        for(key in o2) {
                            if (!keySet.hasOwnProperty(key) &&
                                key.charAt(0) !== '$' &&
                                o2[key] !== undefined &&
                                !isFunction(o2[key])) return false;
                        }
                        return true;
                    }
                }
            }
            return false;
        },
        levenshteinArray = function(S1, S2) {

            var m = S1.length,
                n = S2.length,
                D = new Array(m + 1),
                P = new Array(m + 1),
                i, j, c,
                route,
                cost,
                dist,
                ops = 0;

            if (m == n && m == 0) {
                return {
                    changes: 0,
                    distance: 0,
                    prescription: []
                };
            }

            for (i = 0; i <= m; i++) {
                D[i]    = new Array(n + 1);
                P[i]    = new Array(n + 1);
                D[i][0] = i;
                P[i][0] = 'D';
            }
            for (i = 0; i <= n; i++) {
                D[0][i] = i;
                P[0][i] = 'I';
            }

            for (i = 1; i <= m; i++) {
                for (j = 1; j <= n; j++) {
                    cost = (!equals(S1[i - 1], S2[j - 1])) ? 1 : 0;

                    if(D[i][j - 1] < D[i - 1][j] && D[i][j - 1] < D[i - 1][j - 1] + cost) {
                        //Insert
                        D[i][j] = D[i][j - 1] + 1;
                        P[i][j] = 'I';
                    }
                    else if(D[i - 1][j] < D[i - 1][j - 1] + cost) {
                        //Delete
                        D[i][j] = D[i - 1][j] + 1;
                        P[i][j] = 'D';
                    }
                    else {
                        //Replace or noop
                        D[i][j] = D[i - 1][j - 1] + cost;
                        if (cost == 1) {
                            P[i][j] = 'R';
                        }
                        else {
                            P[i][j] = '-';
                        }
                    }
                }
            }

            //Prescription
            route = [];
            i = m;
            j = n;

            do {
                c = P[i][j];
                route.push(c);
                if (c != '-') {
                    ops++;
                }
                if(c == 'R' || c == '-') {
                    i --;
                    j --;
                }
                else if(c == 'D') {
                    i --;
                }
                else {
                    j --;
                }
            } while((i != 0) || (j != 0));

            dist = D[m][n];

            return {
                changes: ops / route.length,
                distance: dist,
                prescription: route.reverse()
            };
        },


        observable;



    var Watchable   = function(dataObj, code, fn, fnScope, userData, namespace) {

        if (!observable) {
            observable  = new Observable;
        }

        var self    = this,
            id      = nextUid(),
            type;

        if (namespace) {
            self.namespace = namespace;
            self.nsGet = namespace.get;
        }

        self.origCode = code;

        if (isArray(dataObj) && code === null) {
            type    = "array";
        }
        else {

            if (!isString(code)) {
                fnScope = fn;
                fn      = code;
                code    = null;
                type    = "object"; // isArray(obj) ? "collection" :
            }
            if (isString(dataObj)) {
                fnScope = fn;
                fn      = code;
                code    = dataObj;
                dataObj = null;
            }

            if (code && dataObj) {
                type    = dataObj.hasOwnProperty(code) ? "attr" : "expr";
            }
            if (code && !dataObj) {
                type    = "expr";
            }
        }

        if (fn) {
            observable.on(id, fn, fnScope || this, {
                append: [userData],
                allowDupes: true
            });
        }

        if (type == "expr") {
            code        = self._processInputPipes(code, dataObj);
            code        = self._processPipes(code, dataObj);

            if (self.inputPipes || self.pipes) {
                code    = normalizeExpr(dataObj, code);
                type    = dataObj.hasOwnProperty(code) ? "attr" : "expr";
            }

            if (self.staticValue = isStatic(code)) {
                type    = "static";
            }
        }

        self.userData   = userData;
        self.code       = code;
        self.id         = id;
        self.type       = type;
        self.obj        = dataObj;

        if (type == "expr") {
            self.getterFn   = createGetter(code);
        }

        self.curr       = self._getValue();
    };

    Watchable.prototype = {

        namespace: null,
        nsGet: null,
        staticValue: null,
        origCode: null,
        code: null,
        getterFn: null,
        setterFn: null,
        id: null,
        type: null,
        obj: null,
        itv: null,
        curr: null,
        pipes: null,
        inputPipes: null,
        lastSetValue: null,
        userData: null,


        _processInputPipes: function(text, dataObj) {

            if (text.indexOf('>>') == -1) {
                return text;
            }

            var self        = this,
                index       = 0,
                textLength  = text.length,
                pipes       = [],
                pIndex,
                prev, next, pipe,
                ret         = text;

            while(index < textLength && (pIndex  = text.indexOf('>>', index)) != -1) {

                    prev = text.charAt(pIndex -1);
                    next = text.charAt(pIndex + 2);

                    if (prev != '\\' && prev != "'" && prev != '"' && next != "'" && next != '"') {
                        pipe = trim(text.substring(index, pIndex)).split(":");
                        ret = text.substr(pIndex + 2);
                        self._addPipe(pipes, pipe, dataObj, self.onInputParamChange);
                    }

                    index = pIndex + 2;
            }

            if (pipes.length) {
                self.inputPipes = pipes;
            }

            return trim(ret);
        },


        _addPipe: function(pipes, pipe, dataObj, onParamChange) {

            var self    = this,
                name    = pipe.shift(),
                fn      = null,
                ws      = [],
                i, l;

            if (self.nsGet) {
                fn      = self.nsGet("filter." + name, true);
            }
            if (!fn) {
                fn      = window[name] || dataObj[name];
            }

            if (isFunction(fn)) {

                for (i = -1, l = pipe.length; ++i < l;
                     ws.push(create(dataObj, pipe[i], onParamChange, self, null, self.namespace))) {}

                pipes.push([fn, pipe, ws]);
            }
        },

        _processPipes: function(text, dataObj) {

            if (text.indexOf('|') == -1) {
                return text;
            }

            var self        = this,
                index       = 0,
                textLength  = text.length,
                pipes       = [],
                pIndex,
                prev, next, pipe,
                found       = false,
                ret         = text;

            while(index < textLength) {

                if ((pIndex  = text.indexOf('|', index)) != -1) {

                    prev = text.charAt(pIndex -1);
                    next = text.charAt(pIndex + 1);

                    if (prev != '|' && prev != "'" && prev != '"' && next != '|' && next != "'" && next != '"') {
                        if (!found) {
                            found = true;
                            ret = trim(text.substring(0, pIndex));
                        }
                        else {
                            pipe = trim(text.substring(index, pIndex)).split(":");
                            self._addPipe(pipes, pipe, dataObj);
                        }
                    }
                    index = pIndex + 1;
                }
                else {
                    if (found) {
                        pipe = trim(text.substr(index)).split(":");
                        self._addPipe(pipes, pipe, dataObj, self.onPipeParamChange);
                    }
                    break;
                }
            }

            if (pipes.length) {
                self.pipes = pipes;
            }

            return ret;
        },

        _checkCode: function() {

            var self    = this,
                val     = self._getValue(),
                changed = false,
                prev    = self.curr,
                lev;

            if (isArray(prev) && isArray(val)) {

                lev     = levenshteinArray(prev, val);

                if (lev.changes) {
                    self.curr = val.slice();
                    observable.trigger(self.id, lev, val, prev);
                    return true;
                }

                return false;
            }

            if (!equals(prev, val)) {
                self.curr = val;
                observable.trigger(self.id, val, prev);
                changed = true;
            }

            return changed;
        },

        _checkObject: function() {

            var self    = this,
                obj     = self.obj,
                curr    = self.curr;

            if (!equals(curr, obj)) {
                self.curr = copy(obj);
                observable.trigger(self.id, obj, curr);
                return true;
            }

            return false;
        },

        _checkArray: function() {

            var self    = this,
                curr    = self.curr,
                obj     = self.obj,
                lev     = levenshteinArray(curr, obj);

            if (lev.changes) {
                self.curr = obj.slice();
                observable.trigger(self.id, lev, obj, curr);
                return true;
            }

            return false;
        },


        _getValue: function() {

            var self    = this,
                val;

            switch (self.type) {
                case "static":
                    val = self.staticValue;
                    break;

                case "attr":
                    val = self.obj[self.code];
                    break;
                case "expr":
                    val = self.getterFn(self.obj);
                    if (isUndefined(val)) {
                        val = "";
                    }
                    break;
                case "object":
                    val = copy(self.obj);
                    break;
                case "array":
                    val = self.obj;
                    break;
            }

            if (isArray(val)) {
                val = val.slice();
            }

            val = self._runThroughPipes(val, self.pipes);

            return val;
        },

        _runThroughPipes: function(val, pipes) {

            if (pipes) {
                var j,
                    args,
                    exprs,
                    self    = this,
                    jlen    = pipes.length,
                    dataObj = self.obj,
                    z, zl;

                for (j = 0; j < jlen; j++) {
                    exprs   = pipes[j][1];
                    args    = [];
                    for (z = -1, zl = exprs.length; ++z < zl;
                         args.push(evaluate(exprs[z], dataObj))){}

                    args.unshift(dataObj);
                    args.unshift(val);

                    val     = pipes[j][0].apply(null, args);
                }
            }

            return val;
        },

        subscribe: function(fn, fnScope, options) {
            observable.on(this.id, fn, fnScope, options);
        },

        unsubscribe: function(fn, fnScope) {
            return observable.un(this.id, fn, fnScope);
        },

        hasPipes: function() {
            return this.pipes !== null;
        },

        hasInputPipes: function() {
            return this.inputPipes != null;
        },

        getValue: function() {
            return this._getValue();
        },

        setValue: function(val) {

            var self    = this,
                type    = self.type;

            self.lastSetValue = val;

            val = self._runThroughPipes(val, self.inputPipes);

            if (type == "attr") {
                self.obj[self.code] = val;
            }
            else if (type == "expr") {

                if (!self.setterFn) {
                    self.setterFn   = createSetter(self.code);
                }

                self.setterFn(self.obj, val);
            }
            else if (type == "array") {
                self.obj = val;
            }
            else {
                throw "Cannot set value";
            }
        },

        onInputParamChange: function() {
            this.setValue(this.lastSetValue);
        },

        onPipeParamChange: function() {
            this.check();
        },

        check: function() {

            var self    = this;

            switch (self.type) {
                case "expr":
                case "attr":
                case "static":
                    return self._checkCode();

                case "object":
                    return self._checkObject();

                case "array":
                    return self._checkArray();
            }

            return false;
        },

        checkAll: function() {
            return this.obj.$$watchers.$checkAll();
        },

        getLastResult: function() {
            return this.curr;
        },

        setInterval: function(ms) {

            var self    = this;
            if (self.itv) {
                self.clearInterval();
            }
            self.itv = setInterval(function(){self.check();}, ms);
        },

        clearInterval: function() {
            var self    = this;
            if (self.itv) {
                clearInterval(self.itv);
                self.itv = null;
            }
        },

        unsubscribeAndDestroy: function(fn, fnScope) {

            var self    = this,
                id      = self.id;

            observable.un(id, fn, fnScope);

            if (!observable.hasListener(id)) {
                self.destroy();
                return true;
            }

            return false;
        },

        destroy: function() {

            var self    = this,
                pipes   = self.pipes,
                ipipes  = self.inputPipes,
                i, il,
                j, jl,
                ws;

            if (self.itv) {
                self.clearInterval();
            }

            if (pipes) {
                for (i = -1, il = pipes.length; ++i < il;) {
                    ws = pipes[i][2];
                    for (j = -1, jl = ws.length; ++j < jl;) {
                        ws[j].unsubscribeAndDestroy(self.check, self);
                    }
                }
            }
            if (ipipes) {
                for (i = -1, il = ipipes.length; ++i < il;) {
                    ws = ipipes[i][2];
                    for (j = -1, jl = ws.length; ++j < jl;) {
                        ws[j].unsubscribeAndDestroy(self.onInputParamChange, self);
                    }
                }
            }

            if (self.obj) {
                delete self.obj.$$watchers[self.origCode];
            }

            delete self.id;
            delete self.curr;
            delete self.obj;
            delete self.pipes;
            delete self.inputPipes;
            delete self.origCode;
            delete self.code;
            delete self.getterFn;
            delete self.setterFn;
            delete self.lastSetValue;
            delete self.staticValue;
            delete self.userData;
            delete self.namespace;
            delete self.nsGet;

            observable.destroyEvent(self.id);

        }
    };


    var create = function(obj, code, fn, fnScope, userData, namespace) {

            code = normalizeExpr(obj, trim(code));

            if (obj) {
                if (!obj.$$watchers) {
                    obj.$$watchers = {
                        $checkAll: function() {

                            var self    = this,
                                i,
                                changes = 0;

                            for (i in self) {

                                if (i.charAt(0) != '$' && self[i].check()) {
                                    changes++;
                                }
                                else if (i.charAt(0) == '$' && self[i] instanceof Watchable && self[i].check()) {
                                    changes++;
                                }
                            }

                            return changes;
                        },
                        $destroyAll: function() {

                            var self    = this,
                                i;

                            for (i in self) {
                                if (i.charAt(0) != '$' || self[i] instanceof Watchable) {
                                    self[i].destroy();
                                    delete self[i];
                                }
                            }
                        }
                    };
                }

                if (obj.$$watchers[code]) {
                    obj.$$watchers[code].subscribe(fn, fnScope, {append: [userData], allowDupes: true});
                }
                else {
                    obj.$$watchers[code] = new Watchable(obj, code, fn, fnScope, userData, namespace);
                }

                return obj.$$watchers[code];
            }
            else {
                return new Watchable(obj, code, fn, fnScope, userData, namespace);
            }
        },

        unsubscribeAndDestroy = function(obj, code, fn, fnScope) {
            code = trim(code);

            var ws = obj.$$watchers;

            if (ws && ws[code] && ws[code].unsubscribeAndDestroy(fn, fnScope)) {
                delete ws[code];
            }
        },

        normalizeExpr = function(dataObj, expr) {
            if (dataObj && expr) {
                if (dataObj.hasOwnProperty(expr)) {
                    return expr;
                }
                var prop;
                if (expr.charAt(0) == '.') {
                    prop = expr.substr(1);
                    if (dataObj.hasOwnProperty(prop)) {
                        return prop;
                    }
                }
            }
            return expr;
        },


        f               = Function,
        fnBodyStart     = 'try {',
        getterBodyEnd   = ';} catch (thrownError) { return $$interceptor(thrownError, $$itself, ____); }',
        setterBodyEnd   = ';} catch (thrownError) { return $$interceptor(thrownError, $$itself, ____, $$$$); }',

        prepareCode     = function prepareCode(expr) {
            return expr.replace(REG_REPLACE_EXPR, '$1____.$3');
        },


        interceptor     = function(thrownError, func, scope, value) {

            while (scope && !scope.$isRoot) {

                scope = scope.$parent;

                if (scope) {

                    try {
                        if (arguments.length == 4) {
                            return func.call(null, scope, value, emptyFn, func);
                        }
                        else {
                            return func.call(null, scope, emptyFn, func);
                        }
                    }
                    catch (newError) {}
                }
            }

            return undefined;
        },

        isFailed        = function(value) {
            return isUndefined(value) ||
                   (!value && typeof value == "number" && isNaN(value));
        },

        wrapFunc        = function(func) {
            return function() {
                var args = slice.call(arguments),
                    val;

                args.push(interceptor);
                args.push(func);

                val = func.apply(null, args);

                if (isFailed(val)) {
                    args = slice.call(arguments);
                    args.unshift(func);
                    args.unshift(null);
                    return interceptor.apply(null, args);
                }
                else {
                    return val;
                }
            };
        },

        getterCache     = {},
        getterCacheCnt  = 0,

        createGetter    = function createGetter(expr) {
            try {
                if (!getterCache[expr]) {
                    getterCacheCnt++;
                    return getterCache[expr] = wrapFunc(new f(
                        '____',
                        '$$interceptor',
                        '$$itself',
                        "".concat(fnBodyStart, 'return ', expr.replace(REG_REPLACE_EXPR, '$1____.$3'), getterBodyEnd)
                    ));
                }
                return getterCache[expr];
            }
            catch (thrownError){
                return emptyFn;
            }
        },

        setterCache     = {},
        setterCacheCnt  = 0,

        createSetter    = function createSetter(expr) {
            try {
                if (!setterCache[expr]) {
                    setterCacheCnt++;
                    var code = expr.replace(REG_REPLACE_EXPR, '$1____.$3');
                    return setterCache[expr] = wrapFunc(new f(
                        '____',
                        '$$$$',
                        '$$interceptor',
                        '$$itself',
                        "".concat(fnBodyStart, code, ' = $$$$', setterBodyEnd)
                    ));
                }
                return setterCache[expr];
            }
            catch (thrownError) {
                return emptyFn;
            }
        },

        funcCache       = {},
        funcCacheCnt    = 0,

        createFunc      = function createFunc(expr) {
            try {
                if (!funcCache[expr]) {
                    funcCacheCnt++;
                    return funcCache[expr] = wrapFunc(new f(
                        '____',
                        '$$interceptor',
                        '$$itself',
                        "".concat(fnBodyStart, expr.replace(REG_REPLACE_EXPR, '$1____.$3'), getterBodyEnd)
                    ));
                }
                return funcCache[expr];
            }
            catch (thrownError) {
                return emptyFn;
            }
        },

        evaluate    = function(expr, scope) {
            var val;
            if (val = isStatic(expr)) {
                return val;
            }
            return createGetter(expr)(scope);
        },

        resetCache  = function() {
            getterCacheCnt >= 1000 && (getterCache = {});
            setterCacheCnt >= 1000 && (setterCache = {});
            funcCacheCnt >= 1000 && (funcCache = {});
        };


    Watchable.create = create;
    Watchable.unsubscribeAndDestroy = unsubscribeAndDestroy;
    Watchable.normalizeExpr = normalizeExpr;
    Watchable.prepareCode = prepareCode;
    Watchable.createGetter = createGetter;
    Watchable.createSetter = createSetter;
    Watchable.createFunc = createFunc;
    Watchable.eval = evaluate;

    Watchable.enableResetCacheInterval = function() {
        setTimeout(resetCache, 10000);
    };

    return Watchable;
}();



});
