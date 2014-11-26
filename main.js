/* SPAWNING functions */

var ROLES = {
    "harvester": [Game.WORK, Game.WORK, Game.WORK, Game.MOVE],
    "hauler" : [Game.CARRY, Game.CARRY, Game.MOVE,Game.MOVE,Game.MOVE],
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

function spawn(base) {
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
        
        spawnAtLeast(base, role_numbers, "harvester", 1) ||
        spawnAtLeast(base, role_numbers, "hauler", 1) ||
        spawnAtLeast(base, role_numbers, "guard", 2) ||
        spawnAtLeast(base, role_numbers, "healer", 1) ||
        spawnAtLeast(base, role_numbers, "guard", 5) || true;
    }
}

/* WORKER functions */
function harvester(creep, source) {
        creep.moveTo(source);
        creep.harvest(source);
}
function hauler(creep, base) {
    if (creep.energy < creep.energyCapacity)
    {
        target = creep.pos.findNearest(Game.DROPPED_ENERGY);
        if(!target) return;
        creep.moveTo(target);
        creep.pickup(target);
        return;
    } 
    creep.moveTo(base);
    creep.transferEnergy(base); 
}
/* MAIN */

var base = Game.spawns.Spawn1;
var source = base.room.find(Game.SOURCES)[0];
var construction_sites = base.room.find(Game.CONSTRUCTION_SITES);
var enemies = base.room.find(Game.HOSTILE_CREEPS);
var outpost = Game.flags.Flag1;
var my_creeps = base.room.find(Game.MY_CREEPS);
var damaged_creeps = []; // TODO create healing queue

spawn(base);

function needsHeal(cr) {
    return cr.hits > 0 && cr.hits < cr.hitsMax;
}

for(var creep_index in my_creeps) {
    var creep = my_creeps[creep_index];
    var role = creep.memory.role;

    if(role == "harvester") {
        harvester(creep, source);
    } else if (role == "builder") {
        if(creep.energy === 0) {
            creep.moveTo(base);
            base.transferEnergy(creep);
        } else if(construction_sites.length) {
            creep.moveTo(construction_sites[0]);
            creep.build(construction_sites[0]);
        }
    } else if (role == "hauler") {
            hauler(creep, base);
    } else if (role == "guard") {
        if (enemies.length) {
            creep.moveTo(enemies[0]);
            creep.attack(enemies[0]);
        } else {
            creep.moveTo(outpost);
        }
    } else if (role == "healer") {
        var target = creep.memory.target;
        
        if(target && !needsHeal(target)) {
            target = undefined;
        }
        
        if(!target) {
            // TODO search for a target
            for(var i in my_creeps) {
                var patient = my_creeps[i];
                if(needsHeal(patient)) {
                    target = patient;
                    console.log(creep.name, "heals", target.name);
                    break;
                }
            }
        }
        
        if(target) {
            creep.moveTo(target);
            creep.heal(target);
        } else {
            creep.moveTo(outpost);
        }
        
        creep.memory.target = target;
    }
}
