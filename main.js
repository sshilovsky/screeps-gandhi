/* SPAWNING functions */
var _ = require('lodash');

var ROLES = {
    "harvester": [Game.MOVE, Game.WORK, Game.WORK, Game.WORK, Game.WORK],
    "hauler" : [Game.CARRY, Game.MOVE, Game.CARRY, Game.MOVE],
    "guard": [Game.ATTACK, Game.ATTACK, Game.ATTACK, Game.ATTACK, Game.MOVE],
    "healer": [Game.HEAL, Game.MOVE, Game.HEAL, Game.MOVE],
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
        
        spawnAtLeast(base, role_numbers, "harvester", 2) ||
        spawnAtLeast(base, role_numbers, "hauler", 2) ||
        spawnAtLeast(base, role_numbers, "guard", 1) ||
        spawnAtLeast(base, role_numbers, "hauler", 3) ||
        spawnAtLeast(base, role_numbers, "healer", (role_numbers.guard || 0) / 3) ||
        createCreep(base, "guard");
    }
}

/* WORKER functions */
function xy2pos(room, xy) {
    var zxy = xy.split('_');
    return room.getPositionAt(zxy[1], zxy[2]);
}

function pos2xy(pos) {
    return "_" + pos.x + "_" + pos.y;
}

function object2xy(object) {
    return pos2xy(object.pos);
}

function objects2xyd(array) {
    var result = {};
    for (var index in array) {
        var xy = object2xy(array[index]);
        result[xy] = true;
    }
    return result;
}

function get_free_sources_xy(room) {
    var sources_xy = Memory.free_sources;
    if (sources_xy === undefined) {
        var sources = room.find(Game.SOURCES);
        Memory.free_sources = sources_xy = objects2xyd(sources);
    }
    return sources_xy;
}

function find_nearest_xy(from_pos, xys) {
    var nearest_dist;
    var nearest_xy;
    for(var xy in xys) {
        var pos = xy2pos(Game.getRoom(from_pos.roomName), xy);
        var dist = from_pos.findPathTo(pos).length;
        if (dist !== undefined && (nearest_dist === undefined || nearest_dist > dist)) {
            nearest_dist = dist;
            nearest_xy = xy;
        }
    }
    return nearest_xy;
}

function harvester(creep) {
    var source_xy = creep.memory.source;
    if (source_xy === undefined) {
        var sources_xy = get_free_sources_xy(creep.room);
        creep.memory.source = source_xy = find_nearest_xy(creep.pos, sources_xy);
        delete Memory.free_sources[source_xy];
    }
    var source_pos = xy2pos(creep.room, source_xy);
    creep.moveTo(source_pos);

    if(source_pos.isNearTo(creep.pos)) {
        var source = source_pos.findNearest(Game.SOURCES);
        creep.harvest(source);
        // TODO mark position as constant energy supply for haulers
    }
    // TODO unalloc source if harvester is dead
}

function healer(creep) {
    var target_name = creep.memory.target;
    var target = Game.creeps[target_name];
    
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
    
    creep.memory.target = target ? target.name : undefined;
}

function guard(creep) {
    if (enemies.length) {
        creep.moveTo(enemies[0]);
        creep.attack(enemies[0]);
    } else {
        creep.moveTo(outpost);
    }
}

function builder(creep, base) {
    if(creep.energy === 0) {
        creep.moveTo(base);
        base.transferEnergy(creep);
    } else if(construction_sites.length) {
        creep.moveTo(construction_sites[0]);
        creep.build(construction_sites[0]);
    }
}

function hauler(creep, base) {
    if (creep.energy < creep.energyCapacity)
    {
        var target_xy = creep.memory.target_xy;
        var target;
        if(target_xy !== undefined) {
            var objects = creep.room.lookAt(target_xy[0], target_xy[1]);
            objects = _.filter(objects, {"type": "energy"});
            if(objects.length) {
                target = objects[0].energy;
            }
        }
        if(target !== undefined && target.pos === undefined) {
            target = undefined;
        }
        if(!target) {
            target = creep.pos.findNearest(Game.DROPPED_ENERGY); // TODO queue           
        }
        if(target) {
            creep.memory.target_xy = [target.pos.x, target.pos.y];
            creep.moveTo(target);
            creep.pickup(target);
        } else {
            creep.memory.target_xy = undefined;
        }
    } else {
        creep.moveTo(base);
        creep.transferEnergy(base);
        creep.memory.target_xy = undefined;
    }
}
/* MAIN */

var base = Game.spawns.Spawn1;
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
        harvester(creep);
    } else if (role == "builder") {
        builder(creep, base);
    } else if (role == "hauler") {
            hauler(creep, base);
    } else if (role == "guard") {
        guard(creep);
    } else if (role == "healer") {
        healer(creep);
    }
}
