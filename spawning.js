var ROLES = {
    "worker": [Game.WORK, Game.CARRY, Game.MOVE],
    "guard": [Game.TOUGH, Game.TOUGH, Game.ATTACK, Game.ATTACK, Game.MOVE],
    "healer": [Game.HEAL, Game.MOVE],
};

function createCreep(spawn, role) {
    if(!ROLES[role]) {
        console.log("shouldn't have happened: createCreep() invalid role:", role);
        return;
    }
    var res = spawn.createCreep(ROLES[role], 0, {"role": role});
    switch(res) {
        case Game.ERR_NOT_OWNER:
            console.log("shouldn't have happened: createCreep() ERR_NOT_OWNER");
            break;
        case Game.ERR_NAME_EXISTS:
            console.log("shouldn't have happened: createCreep() ERR_NAME_EXISTS");
            break;
        case Game.ERR_BUSY:
            console.log("shouldn't have happened: createCreep() ERR_BUSY");
            break;
        case Game.ERR_NOT_ENOUGH_ENERGY:
            console.log("createCreep() ERR_NOT_ENOUGH_ENERGY");
            break;
        case Game.ERR_INVALID_ARGS:
            console.log("shouldn't have happened: createCreep() ERR_INVALID_ARGS");
            break;
        case Game.ERR_NOT_ENOUGH_EXTENSIONS:
            console.log("shouldn't have happened: createCreep() ERR_NOT_ENOUGH_EXTENSIONS");
            break;
        default:
            console.log("Spawning", res, "a", role);
    }
}

function spawnAtLeast(spawn, role_numbers, role, num) {
    if ((role_numbers[role] || 0) >= num)
        return false;
    
    createCreep(spawn, role);
    return true;
}

module.exports = function(base) {
    if (base.spawning === null) {
        var my_creeps = base.room.find(Game.MY_CREEPS);
    
        var role_numbers = {};
        // counting existing units
        for(var creep_index in my_creeps) {
            var creep = my_creeps[creep_index];
    
            var role = creep.memory.role;
            if (role_numbers[role] === undefined)
                role_numbers[role] = 1;
            else
                role_numbers[role] += 1;
        }
        if(role_numbers[""]) {
            console.log("creep with no role");
        }
        
        spawnAtLeast(base, role_numbers, "worker", 4) ||
        spawnAtLeast(base, role_numbers, "guard", 2) ||
        spawnAtLeast(base, role_numbers, "healer", 1) ||
        spawnAtLeast(base, role_numbers, "guard", 5) || true;
    }
}
