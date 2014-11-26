var harvester = require('harvester');

var base = Game.spawns.Spawn1;
var source = base.room.find(Game.SOURCES)[0];
var construction_sites = base.room.find(Game.CONSTRUCTION_SITES);
var enemies = base.room.find(Game.HOSTILE_CREEPS);
var outpost = Game.flags.Flag1;
var my_creeps = base.room.find(Game.MY_CREEPS);
var damaged_creeps = []; // TODO create healing queue

require('spawning')(base);

function needsHeal(cr) {
    return cr.hits > 0 && cr.hits < cr.hitsMax;
}

for(var creep_index in my_creeps) {
    var creep = my_creeps[creep_index];
    var role = creep.memory.role;

    if(role == "harvester") {
        harvester(creep, source, base);
    } else if (role == "builder") {
        if(creep.energy === 0) {
            creep.moveTo(base);
            base.transferEnergy(creep);
        } else if(construction_sites.length) {
            creep.moveTo(construction_sites[0]);
            creep.build(construction_sites[0]);
        }
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
