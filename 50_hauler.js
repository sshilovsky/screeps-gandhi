if (Memory.drops === undefined)
    Memory.drops = {};

function hauler_collect(creep)
{
    var room = creep.room;
    var target_xy = creep.memory.target;

    var pos = xy2pos(room, target_xy);
    creep.moveTo(pos);
    if (creep.pos.isNearTo(pos))
    {
        var objects = room.lookAt(pos.x * 1, pos.y * 1); // WTF
        for(var index in objects)
        {
            var type = objects[index].type;
            if (type != "energy")
                continue;
            var energy = objects[index].energy;
            creep.pickup(energy);
        }

        hauler_free_bind(creep);
    }
}

function hauler_vacant(creep)
{
    // is called for hauler not bound to some dropped energy item
    var room = creep.room;
    var drops = room.find(Game.DROPPED_ENERGY);

    for(var drop_index in drops) {
        var drop = drops[drop_index];

        var memory_drops = Memory.drops[room.name];
        if (memory_drops === undefined)
            memory_drops = Memory.drops[room.name] = {};

        var drop_xy = object2xy(drop);
        var bound = memory_drops[drop_xy] || 0;

        if (bound < drop.energy) {
            // go there
            var my_bound = creep.energyCapacity - creep.energy;
            bound += my_bound;
            memory_drops[drop_xy] = bound;
            creep.memory.target = drop_xy;
            creep.memory.bound = my_bound;
            return true;
        }
    }
    return false;
}

function hauler_free_bind(creep)
{
    var room = creep.room;
    var target_xy = creep.memory.target;
    if (target_xy !== undefined)
    {
        var my_bound = creep.memory.bound;
        if (my_bound === undefined)
        {
            my_bound = creep.energyCapacity;
            console.log("warning: bound was lost. supposing", my_bound);
        }

        var memory_drops = Memory.drops[room.name];
        if (memory_drops === undefined)
            memory_drops = Memory.drops[room.name] = {};
        var old = memory_drops[target_xy] || 0;
        var neu = old - my_bound;
        if (neu <= 0)
            delete memory_drops[target_xy];
        else
            memory_drops[target_xy] = neu;

        delete creep.memory.target;
        delete creep.memory.bound;
    }
}

function hauler(creep, base)
{
    if (creep.energy < creep.energyCapacity)
    {
        if (creep.memory.target !== undefined)
            hauler_collect(creep);
        if (creep.memory.target === undefined)
            hauler_vacant(creep);
    }
    else
    {
        hauler_free_bind(creep);
        creep.moveTo(base);
        creep.transferEnergy(base);
    }
}
