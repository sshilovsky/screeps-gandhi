function needs_heal(cr)
{
    return cr.hits > 0 && cr.hits < cr.hitsMax;
}

function healer(creep)
{
    var target = creep.pos.findNearest(Game.MY_CREEPS, { "filter": needs_heal });
    if (target)
    {
        creep.moveTo(target);
        creep.heal(target);
    }
    else
    {
        creep.moveTo(outpost);
    }
}

