var eaTemplating = {
    templates: [],
    specialRulesData: {},
    unitsData: {},
    weaponsData: {},

    initialize: function () {
        eaTemplating.templates['error'] = Handlebars.compile($("#error-template").html());
        
        // Load special rules data
        $.get("lists/specialRules.json").done(function (data) {
            // Create a lookup map for quick access by rule name
            eaTemplating.specialRulesData = {};
            if (data.rules) {
                data.rules.forEach(function(rule) {
                    eaTemplating.specialRulesData[rule.title] = rule;
                });
            }
        });

        // Load weapons data
        $.get("lists/weapons.json").done(function (data) {
            eaTemplating.weaponsData = {
                weapons: {},
                rules: {}
            };
            
            if (data.rules) {
                data.rules.forEach(function(rule) {
                    eaTemplating.weaponsData.rules[rule.name] = rule;
                });
            }
            
            if (data.weapons) {
                data.weapons.forEach(function(weapon) {
                    // Process special rules for weapons
                    weapon.modes.forEach(function(mode) {
                        if (mode.specialRules) {
                            mode.specialRules = mode.specialRules.map(function(sRule) {
                                if (eaTemplating.weaponsData.rules[sRule]) {
                                    return eaTemplating.weaponsData.rules[sRule];
                                } else {
                                    return {
                                        "name": sRule,
                                        "description": "Unknown special rule " + sRule
                                    };
                                }
                            });
                        }
                    });
                    eaTemplating.weaponsData.weapons[weapon.name] = weapon;
                });
            }
        });

        // Load units data - this will be populated when army data is loaded
        eaTemplating.unitsData = {};

        $.get("partials/special-rules.html").done(function (template) {
            Handlebars.registerPartial('special-rules', template);
        });

        $.get("partials/card-with-margin.html").done(function (template) {
            Handlebars.registerPartial('card-with-margin', template);
        });

        $.get("partials/weapons.html").done(function (template) {
            Handlebars.registerPartial('weapons', template);
        });

        $.get("partials/upgrade.html").done(function (template) {
            Handlebars.registerPartial('upgrade', template);
        });

        $.get("templates/army.html").done(function (template) {
            eaTemplating.templates['army'] = Handlebars.compile(template);
        });

        $.get("templates/units.html").done(function (template) {
            eaTemplating.templates['units'] = Handlebars.compile(template);
        });

        $.get("templates/list.html").done(function (template) {
            eaTemplating.templates['list'] = Handlebars.compile(template);
        });

        Handlebars.registerHelper('appendPlural', function (number) {
            return number > 1 ? "s" : "";
        });

        Handlebars.registerHelper('numberAsText', function (number, capitalize) {
            function toText(number) {
                if (number === 1) {
                    return "one";
                } else if (number === 2) {
                    return "two";
                } else if (number === 3) {
                    return "three";
                } else if (number === 4) {
                    return "four";
                } else if (number === 5) {
                    return "five";
                } else if (number === 6) {
                    return "six";
                } else if (number === 7) {
                    return "seven";
                } else if (number === 8) {
                    return "eight";
                } else if (number === 9) {
                    return "nine";
                } else if (number === 10) {
                    return "ten";
                }
            }

            const word = toText(number)
            return capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
        });

        Handlebars.registerHelper('oddEven', function (index) {
            return index % 2 === 0 ? 'even' : 'odd';
        });

        Handlebars.registerHelper('eq', function (v1, v2) {
            return v1 === v2;
        });

        Handlebars.registerHelper('not', function (v1, v2) {
            return v1 !== v2;
        });

        Handlebars.registerHelper('and', function (one, two) {
            return true === one && true === two;
        });

        Handlebars.registerHelper('isArray', function (object) {
            return $.isArray(object);
        });

        Handlebars.registerHelper('appendOnNumber', function (value, suffix) {
            if (isNaN(value)) {
                return value;
            } else {
                return value + suffix;
            }
        });

        Handlebars.registerHelper('upgrade', function (context, options) {
            if (options.data) {
                var data = Handlebars.createFrame(options.data);
                data.options = context.options !== undefined ? context.options.length : 0;
            }

            return options.fn(context, {data: data})
        });

        Handlebars.registerHelper('hasSpecialNotes', function (value) {
            return value !== undefined && (value.specialRules !== undefined || value.notes !== undefined || value.crit !== undefined);
        });

        Handlebars.registerHelper('unit', function (context, options) {
            if (options.data) {
                var data = Handlebars.createFrame(options.data);

                var count = 0;
                if (context.weapons) {
                    context.weapons.forEach(function(weaponString) {
                        var weapon = Handlebars.helpers.parseWeapon(weaponString);
                        if (weapon && weapon.modes) {
                            count += weapon.modes.length;
                        }
                    });
                }

                data.weaponLines = count;
                data.hasNotes = context.notes || context.specialRules;
                data.hasNoNotes = !data.hasNotes;
                data.singleLine = count == 1 && data.hasNoNotes;
            }

            return options.fn(context, {data: data})
        });

        Handlebars.registerHelper('specialRuleTooltip', function (ruleName) {
            var rule = eaTemplating.specialRulesData[ruleName];
            
            // If no exact match, try to find a parameterized version
            if (!rule) {
                // Replace any content in parentheses with (x) to match template rules
                // Also remove any whitespace before parentheses
                // e.g. "Graviton(2)" becomes "Graviton(x)", "Graviton (2)" becomes "Graviton(x)"
                var templateName = ruleName.replace(/\s*\([^)]+\)/g, '(x)');
                rule = eaTemplating.specialRulesData[templateName];
            }
            
            if (rule && rule.description) {
                // Join description paragraphs with double line breaks for better formatting
                var description = rule.description.join('\n\n');
                // Remove HTML tags for tooltip (since we're using plain text)
                description = description.replace(/<[^>]*>/g, '');
                // Escape quotes for HTML attribute
                description = description.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                return new Handlebars.SafeString(
                    '<span class="special-rule-tooltip" data-tooltip="' + description + '">' + ruleName + '</span>'
                );
            }
            return ruleName;
        });

        Handlebars.registerHelper('unitTooltip', function (unitName, count) {
            // Check if unitName contains a variant specification (e.g., "Legion Rapier|Laser Destroyer")
            var baseUnitName = unitName;
            var variantName = null;
            
            if (unitName.includes('|')) {
                var parts = unitName.split('|');
                baseUnitName = parts[0];
                variantName = parts[1];
            }
            
            var unit = eaTemplating.unitsData[baseUnitName];
            
            if (unit) {
                var tooltip = '';
                
                // Function to format weapons
                function formatWeapons(weapons) {
                    if (!weapons || weapons.length === 0) return [];
                    
                    return weapons.map(function(weapon) {
                        if (typeof weapon === 'string') {
                            // Parse the weapon string using the existing helper
                            weapon = Handlebars.helpers.parseWeapon(weapon);
                        }
                        
                        if (weapon && weapon.name) {
                            var weaponStr = '';
                            
                            // Add count if present (before weapon name)
                            if (weapon.count && weapon.count !== '1' && weapon.count > 1) {
                                weaponStr += weapon.count + 'x ';
                            }
                            
                            weaponStr += weapon.name;
                            
                            // Add primary mode info if available
                            if (weapon.modes && weapon.modes.length > 0) {
                                var primaryMode = weapon.modes[0];
                                var modeInfo = [];
                                
                                if (primaryMode.range) modeInfo.push(primaryMode.range + 'cm');
                                if (primaryMode.firepower) modeInfo.push(primaryMode.firepower);
                                
                                if (modeInfo.length > 0) {
                                    weaponStr += ' ' + modeInfo.join(' ');
                                }
                            }
                            
                            return weaponStr;
                        } else {
                            return 'Unknown Weapon';
                        }
                    });
                }
                
                // Function to format titan weapon mounts
                function formatWeaponMounts(weaponMounts) {
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
                                    // Extract weapon names from strings like "Turbo-Laser Destructor|0-1|FxF"
                                    var weaponNames = type.weapons.map(function(weapon) {
                                        if (typeof weapon === 'string') {
                                            // Split by '|' and take the first part (weapon name)
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
                }
                
                // Check if unit has variants
                if (unit.variants && unit.variants.length > 0) {
                    // If a specific variant is requested, show only that variant
                    if (variantName) {
                        var specificVariant = unit.variants.find(function(variant) {
                            return variant.name === variantName;
                        });
                        
                        if (specificVariant) {
                            // Show full unit name with variant in parentheses format
                            tooltip += baseUnitName + ' (' + variantName + ')';
                            if (unit.type) {
                                tooltip += ' (' + unit.type + ')';
                            }
                            tooltip += '\n\n';
                            
                            var variantStats = [];
                            if (specificVariant.speed !== undefined) variantStats.push('Speed: ' + specificVariant.speed + 'cm');
                            if (specificVariant.armour !== undefined) variantStats.push('Armour: ' + specificVariant.armour + '+');
                            if (specificVariant.cc !== undefined) variantStats.push('CC: ' + specificVariant.cc + '+');
                            if (specificVariant.ff !== undefined) variantStats.push('FF: ' + specificVariant.ff + '+');
                            
                            if (variantStats.length > 0) {
                                tooltip += variantStats.join(', ') + '\n';
                            }
                            
                            // Add weapons or weapon mounts for this variant
                            if (specificVariant.weaponMounts && specificVariant.weaponMounts.length > 0) {
                                // Handle titan variants with weapon mounts
                                var variantMounts = formatWeaponMounts(specificVariant.weaponMounts);
                                if (variantMounts.length > 0) {
                                    tooltip += variantMounts.map(function(mount) { return '• ' + mount; }).join('\n');
                                }
                            } else if (specificVariant.weapons && specificVariant.weapons.length > 0) {
                                // Handle regular variant weapons
                                var variantWeapons = formatWeapons(specificVariant.weapons);
                                if (variantWeapons.length > 0) {
                                    tooltip += variantWeapons.map(function(weapon) { return '• ' + weapon; }).join('\n');
                                }
                            }
                            
                            // Add special rules for this variant
                            if (specificVariant.specialRules && specificVariant.specialRules.length > 0) {
                                tooltip += '\nSpecial Rules: ' + specificVariant.specialRules.join(', ');
                            }
                            
                            // Add base unit special rules if any (but don't duplicate)
                            if (unit.specialRules && unit.specialRules.length > 0) {
                                tooltip += '\nBase Unit Special Rules: ' + unit.specialRules.join(', ');
                            }
                        } else {
                            // Variant not found, fall back to showing all variants
                            tooltip += baseUnitName + ' (Variant "' + variantName + '" not found)';
                            if (unit.type) {
                                tooltip += ' (' + unit.type + ')';
                            }
                            tooltip += '\n\nAvailable variants: ' + unit.variants.map(function(v) { return v.name; }).join(', ');
                        }
                    } else {
                        // Show all variants (original behavior)
                        tooltip += baseUnitName;
                        if (unit.type) {
                            tooltip += ' (' + unit.type + ')';
                        }
                        tooltip += '\n\n';
                        
                        unit.variants.forEach(function(variant, index) {
                            tooltip += 'Variant - ' + variant.name + '\n';
                            
                            var variantStats = [];
                            if (variant.speed !== undefined) variantStats.push('Speed: ' + variant.speed + 'cm');
                            if (variant.armour !== undefined) variantStats.push('Armour: ' + variant.armour + '+');
                            if (variant.cc !== undefined) variantStats.push('CC: ' + variant.cc + '+');
                            if (variant.ff !== undefined) variantStats.push('FF: ' + variant.ff + '+');
                            
                            if (variantStats.length > 0) {
                                tooltip += variantStats.join(', ') + '\n';
                            }
                            
                            // Add weapons or weapon mounts for this variant
                            if (variant.weaponMounts && variant.weaponMounts.length > 0) {
                                // Handle titan variants with weapon mounts
                                var variantMounts = formatWeaponMounts(variant.weaponMounts);
                                if (variantMounts.length > 0) {
                                    tooltip += variantMounts.map(function(mount) { return ' * ' + mount; }).join('\n');
                                }
                            } else if (variant.weapons && variant.weapons.length > 0) {
                                // Handle regular variant weapons
                                var variantWeapons = formatWeapons(variant.weapons);
                                if (variantWeapons.length > 0) {
                                    tooltip += variantWeapons.map(function(weapon) { return ' * ' + weapon; }).join('\n');
                                }
                            }
                            
                            // Add special rules for this variant
                            if (variant.specialRules && variant.specialRules.length > 0) {
                                tooltip += '\n * Special Rules: ' + variant.specialRules.join(', ');
                            }
                            
                            // Add spacing between variants (but not after the last one)
                            if (index < unit.variants.length - 1) {
                                tooltip += '\n\n';
                            }
                        });
                        
                        // Add base unit special rules if any
                        if (unit.specialRules && unit.specialRules.length > 0) {
                            tooltip += '\n\nSpecial Rules: ' + unit.specialRules.join(', ');
                        }
                    }
                } else {
                    // Standard unit without variants
                    // Start with unit name and type in parentheses
                    tooltip += baseUnitName;
                    if (unit.type) {
                        tooltip += ' (' + unit.type + ')';
                    }
                    
                    // Add stats if available
                    var stats = [];
                    if (unit.speed !== undefined) stats.push('Speed: ' + unit.speed + 'cm');
                    if (unit.armour !== undefined) stats.push('Armour: ' + unit.armour + '+');
                    if (unit.cc !== undefined) stats.push('CC: ' + unit.cc + '+');
                    if (unit.ff !== undefined) stats.push('FF: ' + unit.ff + '+');
                    
                    if (stats.length > 0) {
                        tooltip += '\n' + stats.join(', ') + '\n';
                    } else if (unit.type) {
                        tooltip += '\n';
                    }
                    
                    // Add weapons or weapon mounts
                    if (unit.weaponMounts && unit.weaponMounts.length > 0) {
                        // Handle titans with weapon mounts
                        var mountStrings = formatWeaponMounts(unit.weaponMounts);
                        if (mountStrings.length > 0) {
                            tooltip += mountStrings.map(function(mount) { return '• ' + mount; }).join('\n') + '\n';
                        }
                    } else if (unit.weapons && unit.weapons.length > 0) {
                        // Handle regular units with weapons
                        var weaponStrings = formatWeapons(unit.weapons);
                        if (weaponStrings.length > 0) {
                            tooltip += weaponStrings.map(function(weapon) { return '• ' + weapon; }).join('\n') + '\n';
                        }
                    }
                    
                    // Add special rules
                    if (unit.specialRules && unit.specialRules.length > 0) {
                        tooltip += '\nSpecial Rules: ' + unit.specialRules.join(', ');
                    }
                }
                
                // Clean up trailing newlines
                tooltip = tooltip.replace(/\n+$/, '');
                
                // Escape quotes for HTML attribute
                tooltip = tooltip.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                
                var pluralSuffix = '';
                if (count > 1) {
                    var nameToCheck = variantName ? baseUnitName : unitName;
                    pluralSuffix = nameToCheck.toLowerCase().endsWith('s') ? '' : 's';
                }
                var displayName = variantName ? baseUnitName + pluralSuffix + ' (' + variantName + ')' : unitName + pluralSuffix;
                return new Handlebars.SafeString(
                    '<a href="' + baseUnitName + '" class="unitlink unit-tooltip" data-tooltip="' + tooltip + '">' + displayName + '</a>'
                );
            }
            
            // Fallback to original display if no unit data
            var pluralSuffix = '';
            if (count > 1) {
                var nameToCheck = variantName ? baseUnitName : unitName;
                pluralSuffix = nameToCheck.toLowerCase().endsWith('s') ? '' : 's';
            }
            var displayName = variantName ? baseUnitName + pluralSuffix + ' (' + variantName + ')' : unitName + pluralSuffix;
            return new Handlebars.SafeString(
                '<a href="' + baseUnitName + '" class="unitlink">' + displayName + '</a>'
            );
        });

        // Helper to parse weapon string and return weapon object
        Handlebars.registerHelper('parseWeapon', function (weaponString) {
            if (typeof weaponString !== 'string') {
                return weaponString; // Already an object
            }
            
            var values = weaponString.split('|');
            var weaponName = values[0];
            var count = values[1] || null;
            var specialRule = values[2] || null;
            
            // Get weapon data from eaTemplating.weaponsData
            if (eaTemplating.weaponsData.weapons && eaTemplating.weaponsData.weapons[weaponName]) {
                var weaponObject = JSON.parse(JSON.stringify(eaTemplating.weaponsData.weapons[weaponName]));
                
                // Add count if specified
                if (count) {
                    weaponObject.count = count;
                }
                
                // Add extra special rules if specified
                if (specialRule && eaTemplating.weaponsData.rules && eaTemplating.weaponsData.rules[specialRule]) {
                    weaponObject.modes.forEach(function (mode) {
                        if (!mode.specialRules) {
                            mode.specialRules = [];
                        }
                        mode.specialRules.push(eaTemplating.weaponsData.rules[specialRule]);
                    });
                }
                
                return weaponObject;
            }
            
            // Fallback for unknown weapons
            return {
                "name": weaponName,
                "modes": [{
                    "firepower": "Unknown"
                }]
            };
        });

        // Helper to check if a weapon has multiple modes
        Handlebars.registerHelper('hasMultipleModes', function (weapon) {
            return weapon && weapon.modes && weapon.modes.length > 1;
        });

        // Helper to get weapon name with count
        Handlebars.registerHelper('weaponDisplayName', function (weapon) {
            if (!weapon || !weapon.name) return 'Unknown Weapon';
            
            var displayName = weapon.name;
            if (weapon.count && weapon.count !== '1') {
                displayName = weapon.count + 'x ' + displayName;
            }
            
            return displayName;
        });

        // Helper to format unit display name with variants and pluralization
        Handlebars.registerHelper('unitDisplayName', function (unitName, count) {
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
        });

        // Helper to parse special rule string and return rule object
        Handlebars.registerHelper('parseSpecialRule', function (ruleName) {
            if (typeof ruleName !== 'string') {
                return ruleName; // Already an object
            }
            
            var rule = eaTemplating.specialRulesData[ruleName];
            
            // If no exact match, try to find a parameterized version
            if (!rule) {
                // Replace any content in parentheses with (x) to match template rules
                // Also remove any whitespace before parentheses
                // e.g. "Graviton(2)" becomes "Graviton(x)", "Graviton (2)" becomes "Graviton(x)"
                var templateName = ruleName.replace(/\s*\([^)]+\)/g, '(x)');
                rule = eaTemplating.specialRulesData[templateName];
            }
            
            if (rule) {
                return rule;
            }
            
            // Fallback for unknown rules
            return {
                "title": ruleName,
                "description": ["Unknown special rule: " + ruleName]
            };
        });


    }
};
