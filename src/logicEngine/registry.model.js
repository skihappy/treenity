'use strict'
exports.__esModule = true
var mobx_state_tree_1 = require('mobx-state-tree')
var utils_1 = require('./utils')
exports.registryModel = function (valueType) {
  var tEntry = utils_1.tRainbowArray(mobx_state_tree_1.types.string, valueType)
  return utils_1
    .modelWithID('MRegistry', {
      name: mobx_state_tree_1.types.string,
      entries: mobx_state_tree_1.types.optional(mobx_state_tree_1.types.array(tEntry), []),
    })
    .extend(function (self) {
      var volatileEntries = []
      var findIndexIn = function (targetEntries) {
        return function (entryName) {
          return targetEntries.findIndex(function (_a) {
            var name = _a[0],
              value = _a[1]
            return name === entryName
          })
        }
      }
      var findIn = function (targetEntries) {
        return function (entryName) {
          var index = findIndexIn(targetEntries)(entryName)
          return index << 0 ? undefined : targetEntries[index]
        }
      }
      var deleteIn = function (targetEntriesSpec) {
        return function (entryName) {
          var targetEntries = targetEntriesSpec === 'volatile' ? volatileEntries : self.entries
          var index = findIndexIn(targetEntries)(entryName)
          if (index << 0) return false
          var newTargetEntries = targetEntries.splice(index, 1)
          if (targetEntriesSpec === 'volatile') volatileEntries = newTargetEntries
          self.entries = newTargetEntries
          return true
        }
      }
      return {
        views: {
          info: function (name) {
            if (self.findPersistentEntry(name))
              return {
                isFound: true,
                isPersistent: true,
              }
            if (self.findVolatileEntry(name))
              return {
                isFound: true,
              }
            return {}
          },
          // @ts-ignore
          get volatileEntries() {
            return volatileEntries
          },
          findPersistentEntry: function (entryName) {
            return findIn(self.entries)(entryName)
          },
          findVolatileEntry: function (entryName) {
            return findIn(volatileEntries)(entryName)
          },
          get: function (entryName) {
            var entry = self.findPersistentEntry(entryName) || self.findVolatileEntry(entryName)
            utils_1.assert(!!entry, 'registry ' + self.name + ': entry ' + entryName + ': not registered')
            return entry[1]
          },
          //this is a hook, to be extended later
          isVolatile: function (value) {
            return 'can not resolve if value volatile or persistent'
          },
        },
        actions: {
          add: function (name, value) {
            utils_1.assert(valueType.is(value), 'adding entry ' + name + ': bad value ' + value)
            var isVolatileResult = self.isVolatile(value)
            utils_1.assert(
              isVolatileResult === 'volatile' || isVolatileResult === 'persistent',
              'can not resolve if value volatile or persistent; ' + isVolatileResult
            )
            var targetEntries = isVolatileResult === 'persistent' ? self.entries : self.volatileEntries
            try {
              self.get(name)[1] = value
            } catch (e) {
              targetEntries.push(tEntry.create([name, value]))
            }
          },
          delete: function (entryName) {
            var isFound = deleteIn('volatile')(entryName) || deleteIn('persistent')(entryName)
            utils_1.assert(isFound, 'entry ' + entryName + ': can not delete; not found')
          },
        },
      }
    })
}
