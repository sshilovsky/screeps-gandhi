var ROLES = {
    "harvester": [Game.MOVE, Game.WORK, Game.WORK, Game.WORK, Game.WORK],
    "hauler": [Game.CARRY, Game.MOVE, Game.CARRY, Game.MOVE],
    "guard": [Game.ATTACK, Game.ATTACK, Game.ATTACK, Game.ATTACK, Game.MOVE],
    "healer": [Game.HEAL, Game.MOVE, Game.HEAL, Game.MOVE],
};

if (Memory.roles === undefined)
{
    var roles = Memory.roles = {};
    for (var role in ROLES)
    {
        roles[role] = { "number": 0 };
    }
}

function create_creep(spawn, role)
{
    if (!ROLES[role])
    {
        console.log("shouldn't have happened: create_creep() invalid role:", role);
        return;
    }
    var res = spawn.createCreep(ROLES[role], 0, { "role": role });
    switch (res)
    {
        case Game.ERR_NOT_OWNER:
            console.log("shouldn't have happened: create_creep() ERR_NOT_OWNER");
            break;
        case Game.ERR_NAME_EXISTS:
            console.log("shouldn't have happened: create_creep() ERR_NAME_EXISTS");
            break;
        case Game.ERR_BUSY:
            console.log("shouldn't have happened: create_creep() ERR_BUSY");
            break;
        case Game.ERR_NOT_ENOUGH_ENERGY:
            console.log("create_creep() ERR_NOT_ENOUGH_ENERGY");
            break;
        case Game.ERR_INVALID_ARGS:
            console.log("shouldn't have happened: create_creep() ERR_INVALID_ARGS");
            break;
        case Game.ERR_NOT_ENOUGH_EXTENSIONS:
            console.log("shouldn't have happened: create_creep() ERR_NOT_ENOUGH_EXTENSIONS");
            break;
        default:
            console.log("Spawning", res, "a", role);
            Memory.roles[role].number += 1;
    }
}

function spawn_at_least(spawn, role, num)
{
    if (Memory.roles[role].number >= num)
    {
        return false;
    }

    create_creep(spawn, role);
    return true;
}

