if (Game.time % 5 === 0)
{
    for (var role in ROLES)
    {
        Memory.roles[role].number = 0;
    }

    for (var creep_name in Game.creeps)
    {
        var creep = Game.creeps[creep_name];
        var role = creep.memory.role;
        Memory.roles[role].number += 1;
    }
}

