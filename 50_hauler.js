function hauler(creep, base)
{
    if (creep.energy < creep.energyCapacity)
    {
        var target_xy = creep.memory.target_xy;
        var target;
        if (target_xy !== undefined)
        {
            var objects = creep.room.lookAt(target_xy[0], target_xy[1]);
            objects = _.filter(objects, { "type": "energy" });
            if (objects.length)
            {
                target = objects[0].energy;
            }
        }
        if (target !== undefined && target.pos === undefined)
        {
            target = undefined;
        }
        if (!target)
        {
            target = creep.pos.findNearest(Game.DROPPED_ENERGY); // TODO queue           
        }
        if (target)
        {
            creep.memory.target_xy = [target.pos.x, target.pos.y];
            creep.moveTo(target);
            creep.pickup(target);
        }
        else
        {
            creep.memory.target_xy = undefined;
        }
    }
    else
    {
        creep.moveTo(base);
        creep.transferEnergy(base);
        creep.memory.target_xy = undefined;
    }
}

