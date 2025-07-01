// Unit tooltip functionality for eaTemplating
// This module handles the creation and formatting of unit tooltips

var eaUnitTooltips = {
    // Helper functions for unit tooltip creation
    parseUnitName: function(unitName) {
        var baseUnitName = unitName;
        var variantName = null;
        
        if (unitName.includes('|')) {
            var parts = unitName.split('|');
            baseUnitName = parts[0];
            variantName = parts[1];
        }
        
        return { base: baseUnitName, variant: variantName };
    },

    formatWeapons: function(weapons) {
        if (!weapons || weapons.length === 0) return [];
        
        return weapons.map(function(weapon) {
            if (typeof weapon === 'string') {
                weapon = Handlebars.helpers.parseWeapon(weapon);
            }
            
            if (weapon && weapon.name) {
                var weaponStr = '';
                
                if (weapon.count && weapon.count !== '1' && weapon.count > 1) {
                    weaponStr += weapon.count + 'x ';
                }
                
                weaponStr += weapon.name;
                
                if (weapon.modes && weapon.modes.length > 0) {
                    var primaryMode = weapon.modes[0];
                    var modeInfo = [];
                    
                    if (primaryMode.range) modeInfo.push(primaryMode.range + 'cm');
                    if (primaryMode.firepower) modeInfo.push(primaryMode.firepower);
                    
                    if (modeInfo.length > 0) {
                        weaponStr += ' ' + modeInfo.join(' ');
                    }
                    
                    // Add special rules from all modes
                    var allSpecialRules = [];
                    weapon.modes.forEach(function(mode) {
                        if (mode.specialRules && mode.specialRules.length > 0) {
                            mode.specialRules.forEach(function(rule) {
                                var ruleName = rule && rule.name ? rule.name : rule;
                                if (ruleName && typeof ruleName === 'string' && allSpecialRules.indexOf(ruleName) === -1) {
                                    allSpecialRules.push(ruleName);
                                }
                            });
                        }
                    });
                    
                    if (allSpecialRules.length > 0) {
                        weaponStr += ' (' + allSpecialRules.join(', ') + ')';
                    }
                }
                
                return weaponStr;
            } else {
                return 'Unknown Weapon';
            }
        });
    },

    formatWeaponMounts: function(weaponMounts) {
        if (!weaponMounts || weaponMounts.length === 0) return [];
        
        var mountDescriptions = [];
        
        weaponMounts.forEach(function(mount) {
            var mountDesc = mount.mount;
            if (mount.notes) {
                mountDesc += ' (' + mount.notes + ')';
            }
            mountDesc += ':';
            
            var typeDescs = [];
            if (mount.types) {
                mount.types.forEach(function(type) {
                    var typeDesc = type.name;
                    if (type.weapons && type.weapons.length > 0) {
                        var weaponNames = type.weapons.map(function(weapon) {
                            if (typeof weapon === 'string') {
                                return weapon.split('|')[0];
                            } else if (weapon && weapon.name) {
                                return weapon.name;
                            } else {
                                return 'Unknown Weapon';
                            }
                        });
                        typeDesc += ': ' + weaponNames.join(', ');
                    }
                    typeDescs.push(typeDesc);
                });
            }
            
            if (typeDescs.length > 0) {
                mountDesc += '\n  ' + typeDescs.join('\n  ');
            }
            
            mountDescriptions.push(mountDesc);
        });
        
        return mountDescriptions;
    },

    formatUnitStats: function(unit) {
        var stats = [];
        if (unit.speed !== undefined) stats.push('Speed: ' + unit.speed + 'cm');
        if (unit.armour !== undefined) stats.push('Armour: ' + unit.armour + '+');
        if (unit.cc !== undefined) stats.push('CC: ' + unit.cc + '+');
        if (unit.ff !== undefined) stats.push('FF: ' + unit.ff + '+');
        return stats;
    },

    addWeaponsToTooltip: function(unit, tooltip) {
        if (unit.weaponMounts && unit.weaponMounts.length > 0) {
            var mountStrings = eaUnitTooltips.formatWeaponMounts(unit.weaponMounts);
            if (mountStrings.length > 0) {
                tooltip += mountStrings.map(function(mount) { return '• ' + mount; }).join('\n');
            }
        } else if (unit.weapons && unit.weapons.length > 0) {
            var weaponStrings = eaUnitTooltips.formatWeapons(unit.weapons);
            if (weaponStrings.length > 0) {
                tooltip += weaponStrings.map(function(weapon) { return '• ' + weapon; }).join('\n');
            }
        }
        return tooltip;
    },

    buildVariantTooltip: function(unit, variantName, baseUnitName) {
        var specificVariant = unit.variants.find(function(variant) {
            return variant.name === variantName;
        });
        
        if (!specificVariant) {
            var tooltip = baseUnitName + ' (Variant "' + variantName + '" not found)';
            if (unit.type) {
                tooltip += ' (' + unit.type + ')';
            }
            tooltip += '\n\nAvailable variants: ' + unit.variants.map(function(v) { return v.name; }).join(', ');
            return tooltip;
        }
        
        var tooltip = baseUnitName + ' (' + variantName + ')';
        if (unit.type) {
            tooltip += ' (' + unit.type + ')';
        }
        tooltip += '\n\n';
        
        var variantStats = eaUnitTooltips.formatUnitStats(specificVariant);
        if (variantStats.length > 0) {
            tooltip += variantStats.join(', ') + '\n';
        }
        
        tooltip = eaUnitTooltips.addWeaponsToTooltip(specificVariant, tooltip);
        
        if (specificVariant.specialRules && specificVariant.specialRules.length > 0) {
            tooltip += '\nSpecial Rules: ' + specificVariant.specialRules.join(', ');
        }
        
        if (unit.specialRules && unit.specialRules.length > 0) {
            tooltip += '\nBase Unit Special Rules: ' + unit.specialRules.join(', ');
        }
        
        return tooltip;
    },

    buildAllVariantsTooltip: function(unit, baseUnitName) {
        var tooltip = baseUnitName;
        if (unit.type) {
            tooltip += ' (' + unit.type + ')';
        }
        tooltip += '\n\n';
        
        unit.variants.forEach(function(variant, index) {
            tooltip += 'Variant - ' + variant.name + '\n';
            
            var variantStats = eaUnitTooltips.formatUnitStats(variant);
            if (variantStats.length > 0) {
                tooltip += variantStats.join(', ') + '\n';
            }
            
            if (variant.weaponMounts && variant.weaponMounts.length > 0) {
                var variantMounts = eaUnitTooltips.formatWeaponMounts(variant.weaponMounts);
                if (variantMounts.length > 0) {
                    tooltip += variantMounts.map(function(mount) { return ' * ' + mount; }).join('\n');
                }
            } else if (variant.weapons && variant.weapons.length > 0) {
                var variantWeapons = eaUnitTooltips.formatWeapons(variant.weapons);
                if (variantWeapons.length > 0) {
                    tooltip += variantWeapons.map(function(weapon) { return ' * ' + weapon; }).join('\n');
                }
            }
            
            if (variant.specialRules && variant.specialRules.length > 0) {
                tooltip += '\n * Special Rules: ' + variant.specialRules.join(', ');
            }
            
            if (index < unit.variants.length - 1) {
                tooltip += '\n\n';
            }
        });
        
        if (unit.specialRules && unit.specialRules.length > 0) {
            tooltip += '\n\nSpecial Rules: ' + unit.specialRules.join(', ');
        }
        
        return tooltip;
    },

    buildStandardUnitTooltip: function(unit, baseUnitName) {
        var tooltip = baseUnitName;
        if (unit.type) {
            tooltip += ' (' + unit.type + ')';
        }
        
        var stats = eaUnitTooltips.formatUnitStats(unit);
        if (stats.length > 0) {
            tooltip += '\n' + stats.join(', ') + '\n';
        } else if (unit.type) {
            tooltip += '\n';
        }
        
        tooltip = eaUnitTooltips.addWeaponsToTooltip(unit, tooltip);
        
        if (unit.specialRules && unit.specialRules.length > 0) {
            tooltip += '\nSpecial Rules: ' + unit.specialRules.join(', ');
        }
        
        return tooltip;
    },

    createDisplayName: function(unitName, count, baseUnitName, variantName) {
        var pluralSuffix = '';
        if (count > 1) {
            var nameToCheck = variantName ? baseUnitName : unitName;
            pluralSuffix = nameToCheck.toLowerCase().endsWith('s') ? '' : 's';
        }
        return variantName ? baseUnitName + pluralSuffix + ' (' + variantName + ')' : unitName + pluralSuffix;
    },

    createTooltipHtml: function(displayName, tooltip, baseUnitName) {
        var escapedTooltip = tooltip.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        return new Handlebars.SafeString(
            '<a href="' + baseUnitName + '" class="unitlink unit-tooltip" data-tooltip="' + escapedTooltip + '">' + displayName + '</a>'
        );
    },

    createUnitTooltip: function(unitName, count) {
        var parsedName = eaUnitTooltips.parseUnitName(unitName);
        var baseUnitName = parsedName.base;
        var variantName = parsedName.variant;
        
        var unit = eaTemplating.unitsData[baseUnitName];
        
        if (!unit) {
            var displayName = eaUnitTooltips.createDisplayName(unitName, count, baseUnitName, variantName);
            return new Handlebars.SafeString(
                '<a href="' + baseUnitName + '" class="unitlink">' + displayName + '</a>'
            );
        }
        
        var tooltip = '';
        
        if (unit.variants && unit.variants.length > 0) {
            if (variantName) {
                tooltip = eaUnitTooltips.buildVariantTooltip(unit, variantName, baseUnitName);
            } else {
                tooltip = eaUnitTooltips.buildAllVariantsTooltip(unit, baseUnitName);
            }
        } else {
            tooltip = eaUnitTooltips.buildStandardUnitTooltip(unit, baseUnitName);
        }
        
        tooltip = tooltip.replace(/\n+$/, '');
        
        var displayName = eaUnitTooltips.createDisplayName(unitName, count, baseUnitName, variantName);
        return eaUnitTooltips.createTooltipHtml(displayName, tooltip, baseUnitName);
    },

    // Helper to format unit display name with variants and pluralization
    createUnitDisplayName: function(unitName, count) {
        // Check if unitName contains a variant specification (e.g., "Legion Rapier|Laser Destroyer")
        var baseUnitName = unitName;
        var variantName = null;
        
        if (unitName.includes('|')) {
            var parts = unitName.split('|');
            baseUnitName = parts[0];
            variantName = parts[1];
        }
        
        var pluralSuffix = '';
        if (count > 1) {
            var nameToCheck = variantName ? baseUnitName : unitName;
            pluralSuffix = nameToCheck.toLowerCase().endsWith('s') ? '' : 's';
        }
        
        var displayName = variantName ? baseUnitName + pluralSuffix + ' (' + variantName + ')' : unitName + pluralSuffix;
        return displayName;
    },

    // Initialize unit tooltip Handlebars helpers
    initializeHelpers: function() {
        Handlebars.registerHelper('unitTooltip', function (unitName, count) {
            return eaUnitTooltips.createUnitTooltip(unitName, count);
        });

        Handlebars.registerHelper('unitDisplayName', function (unitName, count) {
            return eaUnitTooltips.createUnitDisplayName(unitName, count);
        });
    }
};

// Backwards compatibility - add functions to eaTemplating object
if (typeof eaTemplating !== 'undefined') {
    eaTemplating.parseUnitName = eaUnitTooltips.parseUnitName;
    eaTemplating.formatWeapons = eaUnitTooltips.formatWeapons;
    eaTemplating.formatWeaponMounts = eaUnitTooltips.formatWeaponMounts;
    eaTemplating.formatUnitStats = eaUnitTooltips.formatUnitStats;
    eaTemplating.addWeaponsToTooltip = eaUnitTooltips.addWeaponsToTooltip;
    eaTemplating.buildVariantTooltip = eaUnitTooltips.buildVariantTooltip;
    eaTemplating.buildAllVariantsTooltip = eaUnitTooltips.buildAllVariantsTooltip;
    eaTemplating.buildStandardUnitTooltip = eaUnitTooltips.buildStandardUnitTooltip;
    eaTemplating.createDisplayName = eaUnitTooltips.createDisplayName;
    eaTemplating.createTooltipHtml = eaUnitTooltips.createTooltipHtml;
    eaTemplating.createUnitTooltip = eaUnitTooltips.createUnitTooltip;
} 