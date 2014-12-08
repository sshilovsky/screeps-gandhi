var base = Game.spawns.Spawn1;
var outpost = Game.flags.Flag1;

for (var creep_name in Memory.creeps)
{
    var creep = Game.creeps[creep_name];
    var mem = Memory.creeps[creep_name];
    var role = mem.role;

    if (!creep)
    { // dead creep
        console.log(creep_name, "a", role, "is dead");
        if (role == "harvester")
        {
            harvester_dead(creep_name);
        }
        Memory.roles[role].number -= 1;
        delete Memory.creeps[creep_name];
        continue;
    }

    if (creep.spawning)
    {
        continue;
    }

    if (role == "harvester")
    {
        harvester(creep);
    }
    else if (role == "builder")
    {
        builder(creep, base);
    }
    else if (role == "hauler")
    {
        hauler(creep, base);
    }
    else if (role == "guard")
    {
        guard(creep);
    }
    else if (role == "healer")
    {
        healer(creep);
    }
}

if (base.spawning === null)
{
    spawn_at_least(base, "harvester", 2) ||
    spawn_at_least(base, "hauler", 2) ||
    spawn_at_least(base, "guard", 1) ||
    spawn_at_least(base, "hauler", 3) ||
    spawn_at_least(base, "healer", Memory.roles.guard.number / 3) ||
    spawn_at_least(base, "hauler", 3) ||
    create_creep(base, "guard");
}

