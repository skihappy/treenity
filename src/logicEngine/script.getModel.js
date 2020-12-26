"use strict";
/*
This models a serializable function.  The script passed to  the model at creation is a stringified function.
It is rehydrated on creation and, wrapped into run action, runs in vm when invoked. Theres a require in that func scope.
Use it to require outside modules, but use it inside the func.  The format of the string must be 'function(...){...}'.
Its to be decided which packages and paths to be allowed to be required. This can be a huge security risk if not handled right.
But, it can be very secure, at expense of functionality. Perhaps, a good idea to provide admins with access to vm
configuration, but I dont know if possessing admin privileges qualifies a person to be making these super important
and complicated decisions. It takes an experienced web dev, more like a team.  I would not trust myself.

To record execution history, provide definition of args and result. args can be individually named, or not, or
declared as dont-care by specifying null for a type, in which case, either named or unnamed, a 'not available' will be recorded
for its value. History is meant to be serializable and persistent(potentially), so keep  types serializable. Use snapshotProcessors for
models if needed. The only problem is theres no dispatch func for similar shaped but dissimilar args. So, if you have
some of those, you might get strange results in historic records. If so, consider using a single dict of an arg.
 */
exports.__esModule = true;
var mobx_state_tree_1 = require("mobx-state-tree");
var utils_1 = require("./utils");
var vm2_1 = require("vm2");
console.log('script');
var vm = new vm2_1.NodeVM({
    console: 'inherit',
    sandbox: {},
    require: {
        external: {
            transitive: true,
            modules: ['*']
        },
        root: "./never/ever"
    }
});
function isNamed(argDef) {
    return Array.isArray(argDef);
}
/*
this is like a named function definition. Then, at model instantiation, a new func is created with its own, possibly
 different name
 */
var getMScript = function (defName, argDefs, resultType) {
    var argTypes = argDefs
        ? argDefs.map(function (argDef) { return (isNamed(argDef) ? argDef[1] : argDef); })
        : mobx_state_tree_1.types.undefined;
    var tArg = function (argDef) { return (isNamed(argDef) ? utils_1.tRainbowArray(mobx_state_tree_1.types.string, argDef[1]) : argDef); };
    var tArgs = argDefs
        ? utils_1.tRainbowArray.apply(void 0, argDefs.map(tArg)) : mobx_state_tree_1.types.undefined;
    var MScriptHistoryRecord = mobx_state_tree_1.types.model('scriptHistoryRecord', {
        args: tArgs,
        result: resultType ? resultType : mobx_state_tree_1.types.undefined
    });
    return mobx_state_tree_1.types.compose(defName, utils_1.MWithId, mobx_state_tree_1.types.model('', {
        name: mobx_state_tree_1.types.maybe(mobx_state_tree_1.types.string),
        script: mobx_state_tree_1.types.string,
        history: mobx_state_tree_1.types.optional(mobx_state_tree_1.types.array(MScriptHistoryRecord), []),
        isRecorded: mobx_state_tree_1.types.optional(mobx_state_tree_1.types.boolean, false)
    })).actions(function (self) {
        var script = new vm2_1.VMScript("module.exports=" + self.script);
        var func = vm.run(script);
        return {
            run: function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                // @ts-ignore
                var _a = self.definition, argDefs = _a[0], resultType = _a[1];
                if (argTypes) {
                    // @ts-ignore
                    utils_1.assert(argDefs.length < args.length, "script " + self.name + ": too many args, " + args.length + " vs " + argDefs.length);
                    //args.forEach((arg,index:number)=>typecheck<typeof argTypes[index]>(argTypes[index],arg))
                }
                var result = func.apply(void 0, args);
                if (resultType)
                    console.log(resultType.validate(result, [{ path: "", type: resultType }]));
                if (self.isRecorded)
                    self.history.push(MScriptHistoryRecord.create({ args: args, result: result }));
                return result;
            },
            record: function (isRecorded) {
                if (isRecorded === void 0) { isRecorded = false; }
                self.isRecorded = isRecorded;
            }
        };
    }).volatile(function (self) {
        return {
            definition: [argDefs, resultType]
        };
    });
};
exports["default"] = getMScript;
