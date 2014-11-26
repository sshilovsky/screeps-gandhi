module.exports = function(creep, source, base) {
    if(creep.energy < creep.energyCapacity) {
        creep.moveTo(source);
        creep.harvest(source);
    } else {
        creep.moveTo(base);
        creep.transferEnergy(base);
    }
};
