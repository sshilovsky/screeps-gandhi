function guard(creep)
{
    var enemy = creep.pos.findNearest(Game.HOSTILE_CREEPS, { "ignoreCreeps": true });
    if (enemy)
    {
        creep.moveTo(enemy);
        creep.attack(enemy);
    }
    else
    {
        creep.moveTo(outpost);
    }
}

