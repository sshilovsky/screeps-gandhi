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

