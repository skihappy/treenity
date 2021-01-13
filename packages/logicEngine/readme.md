Heres how it works.

In a gist, each block runs as a state machine, triggering actions on state changes. The logic engine takes care of updating
state of the block. The triggers react to the state changes. Trigger run inside an autorun in specified sequence.

Each block has input and output pins, that can be connected, outputs to inputs in one to many fashion. Output pins have
values, of type specified by pin type. The type is one of registered types. There are a number of builtin types, more
can be added by a hook at logic engine creation. Its advised to keep types serializable.  If not, logic engine will live
entirely on the server and its state will not be restored from database on server restart.  Also, historic data will be
incomplete and time travel will be limited. One good way to control serialization of values is to use snapshotProcecessor
on their models. As example, functions can be stringified and rehydrated inside a vm.

When a value of output  pin is updated by setValue action of a pin, from inside updateOutputs action, the pin is invalidated 
if changed. A simple '===' test is
set as default, but a custom isSame predicate hook can be used for each pin.  Invalidated pin does not propagate
to the blocks connected to the output pins. The exact strategy is left to the triggers, thus separating the state machine of
the logic engine from its operational logic, which can change from block to block. However, such propagating behaviour
is encapsulated in transactional trigger. When used ahead any other triggers, the invalidated output value will propagate
downstream and no block will be executed till all input pins are valid again, ensuring integrity of input data and avoiding
partial output updates.

it works recursively thru layers of composed blocks. Somehow, the top block gets triggered and updateOutputs action is
fired. How it gets triggered is determined by setTrigger action. There are several built in triggers, but a custom one can be
specified. Triggers can be composed inside custom trigger function. New triggers can be defined by addTrigger action.
Triggers can be accessed thru triggers prop of block model,  for composition and to dynamically change triggers at runtime.
A sequence of triggers can be specified by setTrigger. All triggers are invoked and results are ANDed. A new trigger can
be specified by a sequence as well, with its own name. This design allows to isolate functionality from block state handling.
The engine takes care of block state. Triggers are the brain connected to the block state machine.

Each block can specify a model of its state. The block state is preserved between executions and can be mutated only
from actions of the block, not from  outside, thus insuring all interactions only ver pin connections. Block state can be
mutated only by setState action. It will update stateHasChanged flag of the block.  The flag is automatically reset before
execution of updateOutputs action. The block state can be used to extend the state machine of the logic engine. Only trigger
functions can observe state of other blocks and react to status changes. The updateOutputs action does not have access to
anything outside of its block,  but does have access to local setState and local state. Again, this insures blocks react only
to changes in inputs and local state. 
