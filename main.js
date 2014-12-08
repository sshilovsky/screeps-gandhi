var _ = require('lodash');

/* SPAWNING functions */

var ROLES =
{
    "harvester": [Game.MOVE, Game.WORK, Game.WORK, Game.WORK, Game.WORK],
    "hauler" : [Game.CARRY, Game.MOVE, Game.CARRY, Game.MOVE],
    "guard": [Game.ATTACK, Game.ATTACK, Game.ATTACK, Game.ATTACK, Game.MOVE],
    "healer": [Game.HEAL, Game.MOVE, Game.HEAL, Game.MOVE],
    "builder": [Game.MOVE, Game.CARRY, Game.CARRY, Game.CARRY, Game.WORK],
};

if(Game.time === 0)
{
    var roles = Memory.roles = {};
    for (var role in ROLES)
    {
        roles[role] = { "number": 0 };
    }
}


function createCreep(spawn, role) //TODO remake errors
{
    if(!ROLES[role])
    {
        console.log("shouldn't have happened: createCreep() invalid role:", role);
        return;
    }
    var res = spawn.createCreep(ROLES[role], 0, {"role": role}
    );
    switch(res)
    {
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
            Memory.roles[role].number += 1;
    }
}


function spawnAtLeast(spawn, role, num)
{
    if (Memory.roles[role].number >= num)
        return false;

    createCreep(spawn, role);
    return true;
}
//TODO remake base depend

function spawn_creeps()
{
    var base;
    for(var i in Game.spawns)
    {
        base = Game.spawns[i];
        if (base.spawning === null)
        {
            spawnAtLeast(base, "harvester", 1)                              ||
            spawnAtLeast(base, "hauler", 2)                                 ||
            spawnAtLeast(base, "guard", 3)                                  ||
            spawnAtLeast(base, "healer", Memory.roles.guard.number / 3)     ||
            spawnAtLeast(base, "harvester", allSourcesCount)                ||
            spawnAtLeast(base, "hauler", Memory.roles.harvester.number * 2) ||
            spawnAtLeast(base, "builder", 2)                                ||
            createCreep(base, "guard");
        }
    }
}


/* WORKER functions */
function xy2pos(room, xy)
{
    var zxy = xy.split('_');
    return room.getPositionAt(zxy[1], zxy[2]);
}


function pos2xy(pos)
{
    return "_" + pos.x + "_" + pos.y;
}


function object2xy(object)
{
    return pos2xy(object.pos);
}


function objects2xyd(array)
{
    var result = {};
    for (var index in array)
    {
        var xy = object2xy(array[index]);
        result[xy] = true;
    }
    return result;
}


function get_free_sources_xy(room)
{
    var sources_xy = Memory.free_sources;
    if (sources_xy === undefined)
    {
        var sources = room.find(Game.SOURCES);
        Memory.free_sources = sources_xy = objects2xyd(sources);
    }
    return sources_xy;
}


function find_nearest_xy(from_pos, xys)
{
    var nearest_dist;
    var nearest_xy;
    for(var xy in xys)
    {
        var pos = xy2pos(Game.getRoom(from_pos.roomName), xy);
        var dist = from_pos.findPathTo(pos).length;
        if (dist !== undefined && (nearest_dist === undefined || nearest_dist > dist))
        {
            nearest_dist = dist;
            nearest_xy = xy;
        }
    }
    return nearest_xy;
}


function harvester_dead(creep_name)
{
    var mem = Memory.creeps[creep_name];
    var source_xy = mem.source;
    if(source_xy)
        Memory.free_sources[source_xy] = true;
}

function energyRequest(creep, count)
{
    if (Memory.energyRequest === undefined)
        Memory.energyRequest = [];
        
    while(count--)
        Memory.energyRequest.push(creep.id);

    creep.memory.energyRequested = true;
}

function harvester(creep)
{
    var source_xy = creep.memory.source;
    if (source_xy === undefined)
    {
        var sources_xy = get_free_sources_xy(creep.room);
        creep.memory.source = source_xy = find_nearest_xy(creep.pos, sources_xy);
        delete Memory.free_sources[source_xy];
    }
    var source_pos = xy2pos(creep.room, source_xy);

    if(source_pos.isNearTo(creep.pos))
    {
        var source = source_pos.findNearest(Game.SOURCES);
        creep.harvest(source);
        if (creep.memory.onSource === undefined)
            creep.memory.onSource = true;
// TODO mark position as constant energy supply for haulers
    }
    else
        creep.moveTo(source_pos);
// TODO unalloc source if harvester is dead
}


function healer(creep)
{
    var target = creep.pos.findNearest(Game.MY_CREEPS, {"filter": needsHeal}
    );
    if(target)
    {
        creep.moveTo(target);
        creep.heal(target);
    }
    else
        creep.moveTo(outpost);
}


function guard(creep)
{
    var enemy = creep.pos.findNearest(Game.HOSTILE_CREEPS, {"ignoreCreeps": true}
    );
    if(enemy)
    {
        creep.moveTo(enemy);
        creep.attack(enemy);
    }
    else
        creep.moveTo(outpost);
}

//TODO remake base depend
function builder(creep)
{
    if(creep.memory.energyRequested === undefined || (creep.memory.energyRequested && creep.energy > 50))
        creep.memory.energyRequested = false;

    for (var j in Game.MY_STRUCTURES)
    {
        if (Game.MY_STRUCTURES[j].hits/Game.MY_STRUCTURES[j].hitsMax <= 0.7)
        {
            target = Game.MY_STRUCTURES[j];
            creep.moveTo(target);
            if(creep.repair(target) == Game.ERR_NOT_ENOUGH_ENERGY && !creep.memory.energyRequested)
                energyRequest(creep, creep.energyCapacity / 50);
                
            return;
        }
    }
    if(construction_sites.length)
    {
        creep.moveTo(construction_sites[0]);
        if(creep.build(construction_sites[0]) == Game.ERR_NOT_ENOUGH_ENERGY && !creep.memory.energyRequested)
                energyRequest(creep, creep.energyCapacity / 50);
    }
    else
    {
        if(creep.energy !== 0) //It's worth noting that the CARRY part has weight only when a creep bears energy, else it weighs nothing.  http://screeps.com/docs/concepts.php
             creep.dropEnergy();
        var base = creep.pos.findNearest(Game.MY_SPAWN);
        creep.moveTo(base);
    }
}


function hauler(creep)
{
    var target;
    var spawn;
    if (creep.energy < creep.energyCapacity)
    {
        var target_xy = creep.memory.target_xy;
        if(target_xy !== undefined)
        {
            var objects = creep.room.lookAt(target_xy[0], target_xy[1]);
            objects = _.filter(objects, {"type": "energy"}
            );
            if(objects.length)
                target = objects[0].energy;
        }
        if(target !== undefined && target.pos === undefined)
            target = undefined;
            
        if(!target)
// TODO queue
            target = creep.pos.findNearest(Game.DROPPED_ENERGY);
            
        if(target)
        {
            creep.memory.target_xy = [target.pos.x, target.pos.y];
            creep.moveTo(target);
            creep.pickup(target);
        }
        else
            creep.memory.target_xy = undefined;
    }
    else
    {
        if(creep.memory.target === undefined)
        {
            if(Memory.energyRequest !== undefined && Memory.energyRequest.length)
            {
                target = creep.memory.target = Memory.energyRequest[0];
                Memory.energyRequest.shift();
            }
            else
            {
                for(var i in Game.spawns)
                {
                    spawn = Game.spawns[i];
                    if(spawn.energy < 5000)
                        target = creep.memory.target = spawn.id;
                } 
            }
        }
        else
            target = Game.getObjectById(creep.memory.target);
        creep.moveTo(target);
        if(creep.transferEnergy(target) === Game.OK)
            creep.memory.target = undefined;
        creep.memory.target_xy = undefined;
    }
}


/* MAIN */
var Room = Game.getRoom('1-1');
var construction_sites = Room.find(Game.CONSTRUCTION_SITES);
var outpost = Game.flags.Flag1;
var allSourcesCount = Room.find(Game.SOURCES).length;
// TODO create healing queue
var damaged_creeps = [];

function needsHeal(cr)
{
    return cr.hits > 0 && cr.hits < cr.hitsMax;
}


for(var creep_name in Memory.creeps)
{

    var creep = Game.creeps[creep_name];
    var mem = Memory.creeps[creep_name];
    var role = mem.role;

// dead creep
    if(!creep)
    {
        console.log(creep_name, "a", role, "is dead");
        if(role == "harvester")
            harvester_dead(creep_name);
            
        Memory.roles[role].number -= 1;
        delete Memory.creeps[creep_name];
        continue;
    }

    if(creep.spawning)
        continue;

    if(role == "harvester")
        harvester(creep);
    else if (role == "builder")
        builder(creep);
    else if (role == "hauler")
        hauler(creep);
    else if (role == "guard")
        guard(creep);
    else if (role == "healer")
        healer(creep);

}


spawn_creeps();
