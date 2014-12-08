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

