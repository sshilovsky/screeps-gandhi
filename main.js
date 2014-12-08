var _ = require('lodash');

if (Game.time === 0)
{
    Memory = {};
}

/* AUXILIARY functions */
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

function find_nearest_xyd(from_pos, xyd)
{
    var nearest_dist;
    var nearest_xy;
    for (var xy in xyd)
    {
        var pos = xy2pos(Game.getRoom(from_pos.roomName), xy);
        var dist = from_pos.findPathTo(pos) .length;
        if (dist !== undefined && (nearest_dist === undefined || nearest_dist > dist))
        {
            nearest_dist = dist;
            nearest_xy = xy;
        }
    }
    return nearest_xy;
}

/* SPAWNING functions */
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

/* HARVESTER functions */
function get_free_sources_xyd(room)
{
    var sources_xy = Memory.free_sources;
    if (sources_xy === undefined)
    {
        var sources = room.find(Game.SOURCES);
        Memory.free_sources = sources_xy = objects2xyd(sources);
    }
    return sources_xy;
}

function harvester_dead(creep_name)
{
    var mem = Memory.creeps[creep_name];
    var source_xy = mem.source;
    if (source_xy)
    {
        Memory.free_sources[source_xy] = true;
    }
}

function harvester(creep)
{
    var source_xy = creep.memory.source;
    if (source_xy === undefined)
    {
        var sources_xyd = get_free_sources_xyd(creep.room);
        creep.memory.source = source_xy = find_nearest_xyd(creep.pos, sources_xyd);
        delete Memory.free_sources[source_xy];
    }
    var source_pos = xy2pos(creep.room, source_xy);
    creep.moveTo(source_pos);

    if (source_pos.isNearTo(creep.pos))
    {
        var source = source_pos.findNearest(Game.SOURCES);
        creep.harvest(source);
        // TODO mark position as constant energy supply for haulers
    }
}

/* HEALER functions */
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

/* GUARD functions */
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

/* HAULER functions */
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

/* MAIN */
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
