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
                weapons: {}
            };
            
            if (data.weapons && Array.isArray(data.weapons)) {
                data.weapons.forEach(function(weapon) {
                    if (weapon && weapon.name) {
                        eaTemplating.weaponsData.weapons[weapon.name] = weapon;
                    }
                });
                
                console.log('Weapons data loaded:', Object.keys(eaTemplating.weaponsData.weapons).length, 'weapons');
            } else {
                console.error('Invalid weapons data format');
            }
        }).fail(function(jqxhr, textStatus, error) {
            console.error('Failed to load weapons data:', error);
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

        $.get("partials/unit-stats.html").done(function (template) {
            Handlebars.registerPartial('unit-stats', template);
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

        $.get("templates/quick-reference.html").done(function (template) {
            eaTemplating.templates['quick-reference'] = Handlebars.compile(template);
        });

        $.get("templates/special-rules-list.html").done(function (template) {
            eaTemplating.templates['special-rules-list'] = Handlebars.compile(template);
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

        Handlebars.registerHelper('join', function (array, separator) {
            if (array && Array.isArray(array)) {
                return array.join(separator || ', ');
            }
            return '';
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
            if (ruleName === undefined || ruleName === null || ruleName === '') {
                console.warn("specialRuleTooltip received invalid ruleName:", ruleName);
                return new Handlebars.SafeString(
                    '<span class="special-rule-tooltip" data-tooltip="ERROR: Invalid rule name">UNDEFINED</span>'
                );
            }

            // Convert to string in case we get a non-string value
            ruleName = String(ruleName);
            var rule = eaTemplating.findSpecialRule(ruleName);
            
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

        // Unit tooltip helpers are now initialized from unit-tooltips.js
        if (typeof eaUnitTooltips !== 'undefined') {
            eaUnitTooltips.initializeHelpers();
        }

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
                if (specialRule) {
                    weaponObject.modes.forEach(function (mode) {
                        if (!mode.specialRules) {
                            mode.specialRules = [];
                        }
                        mode.specialRules.push(specialRule);
                    });
                }

                return weaponObject;
            }

            console.error("Weapon not found in data:", weaponName);
            // Fallback for unknown weapons
            return {
                "name": weaponName,
                "modes": [{
                    "firepower": "Unknown",
                    "range": "?"
                }]
            };
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

        // Helper to parse special rule string and return rule object
        Handlebars.registerHelper('parseSpecialRule', function (ruleName) {
            if (typeof ruleName !== 'string') {
                return ruleName; // Already an object
            }
            
            var rule = eaTemplating.findSpecialRule(ruleName);
            
            if (rule) {
                return rule;
            } else {
                // Fallback for unknown rules
                console.error("Special rule not found in data:", ruleName);
                return {
                    "title": ruleName,
                    "description": ["Unknown special rule: " + ruleName]
                };
            }
        });

        // Helper to extract special rules from a single unit (shared logic)
        eaTemplating.extractRulesFromUnit = function(unit, addRuleCallback) {
            // Collect rules from unit itself
            if (unit.specialRules && Array.isArray(unit.specialRules)) {
                unit.specialRules.forEach(function(ruleName) {
                    addRuleCallback(ruleName, 'unit');
                });
            }
            
            // Collect rules from variants
            if (unit.variants && Array.isArray(unit.variants)) {
                unit.variants.forEach(function(variant) {
                    if (variant.specialRules && Array.isArray(variant.specialRules)) {
                        variant.specialRules.forEach(function(ruleName) {
                            addRuleCallback(ruleName, 'unit');
                        });
                    }
                });
            }
            
            // Helper function to process weapons array
            function processWeapons(weapons, source) {
                if (weapons && Array.isArray(weapons)) {
                    weapons.forEach(function(weaponString) {
                        var weapon = Handlebars.helpers.parseWeapon(weaponString);
                        if (weapon && weapon.modes) {
                            weapon.modes.forEach(function(mode) {
                                if (mode.specialRules && Array.isArray(mode.specialRules)) {
                                    mode.specialRules.forEach(function(rule) {
                                        var ruleName = rule && rule.name ? rule.name : rule;
                                        if (ruleName && typeof ruleName === 'string') {
                                            addRuleCallback(ruleName, source || 'weapon');
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
            
            // Helper function to process weapon mounts
            function processWeaponMounts(weaponMounts) {
                if (weaponMounts && Array.isArray(weaponMounts)) {
                    weaponMounts.forEach(function(mount) {
                        if (mount.types && Array.isArray(mount.types)) {
                            mount.types.forEach(function(type) {
                                if (type.weapons && Array.isArray(type.weapons)) {
                                    processWeapons(type.weapons, 'weapon');
                                }
                            });
                        }
                    });
                }
            }
            
            // Collect rules from unit weapons
            processWeapons(unit.weapons);
            
            // Collect rules from unit weapon mounts
            processWeaponMounts(unit.weaponMounts);
            
            // Collect rules from variants' weapons and weapon mounts
            if (unit.variants && Array.isArray(unit.variants)) {
                unit.variants.forEach(function(variant) {
                    processWeapons(variant.weapons);
                    processWeaponMounts(variant.weaponMounts);
                });
            }
        };

        // Helper to process and add a special rule (shared logic)
        eaTemplating.processSpecialRule = function(ruleName, allRules, ruleNames, options) {
            options = options || {};
            var source = options.source;
            var includeSourceAndCore = options.includeSourceAndCore || false;
            
            // First, normalize the rule name to handle parameterized versions
            var normalizedName = ruleName;
            if (ruleName.includes('(') && ruleName.includes(')')) {
                // Normalize parameterized rules to template form (e.g., "MW(2)" -> "MW(x)")
                normalizedName = ruleName.replace(/\s*\([^)]+\)/g, '(x)');
            }
            
            // Check if we already have this rule (use normalized name for deduplication)
            if (ruleNames.has(normalizedName)) {
                return;
            }
            
            // Try to find the rule definition
            var rule = eaTemplating.findSpecialRule(ruleName);
            
            // Add to our deduplication set
            ruleNames.add(normalizedName);
            
            // Create the rule object
            var ruleObject = {
                name: normalizedName,
                description: rule && rule.description ? 
                    (Array.isArray(rule.description) ? rule.description.join(' ') : rule.description) : 
                    'Description not available.'
            };
            
            // Add source and core properties if requested
            if (includeSourceAndCore) {
                ruleObject.source = source;
                ruleObject.core = rule && rule.tags && Array.isArray(rule.tags) && rule.tags.includes('core');
            }
            
            allRules.push(ruleObject);
        };

        // Helper to collect all special rules from units in a section
        Handlebars.registerHelper('collectSpecialRules', function (units) {
            var allRules = [];
            var ruleNames = new Set();
            
            if (!units || !Array.isArray(units)) {
                return allRules;
            }
            
            function addRule(ruleName, source) {
                eaTemplating.processSpecialRule(ruleName, allRules, ruleNames, {
                    source: source,
                    includeSourceAndCore: true
                });
            }
            
            units.forEach(function(unit) {
                eaTemplating.extractRulesFromUnit(unit, addRule);
            });
            
            // Sort rules alphabetically by name
            allRules.sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });
            
            return allRules;
        });

        // Helper to collect all special rules from all unit sections
        Handlebars.registerHelper('collectAllSpecialRules', function (unitSections) {
            var allRules = [];
            var ruleNames = new Set();
            
            if (!unitSections || !Array.isArray(unitSections)) {
                return allRules;
            }
            
            function addRule(ruleName) {
                eaTemplating.processSpecialRule(ruleName, allRules, ruleNames, {
                    includeSourceAndCore: false
                });
            }
            
            // Iterate through all unit sections
            unitSections.forEach(function(sectionGroup) {
                if (Array.isArray(sectionGroup)) {
                    sectionGroup.forEach(function(section) {
                        if (section.unit && Array.isArray(section.unit)) {
                            section.unit.forEach(function(unit) {
                                eaTemplating.extractRulesFromUnit(unit, addRule);
                            });
                        }
                    });
                }
            });
            
            // Sort rules alphabetically by name
            allRules.sort(function(a, b) {
                return a.name.localeCompare(b.name);
            });
            
            return allRules;
        });

        // Shared helper function to find special rule by name with normalization
        eaTemplating.findSpecialRule = function(ruleName) {
            if (!ruleName || typeof ruleName !== 'string') {
                return null;
            }
            
            // Try exact match first
            var rule = eaTemplating.specialRulesData[ruleName];
            if (rule) {
                return rule;
            }
            
            // If no exact match, try to find a parameterized version
            // Normalize parameterized rules to template form (e.g., "MW(2)" -> "MW(x)")
            var templateNameNoSpace = ruleName.replace(/\s*\([^)]+\)/g, '(x)');
            rule = eaTemplating.specialRulesData[templateNameNoSpace];
            if (rule) {
                return rule;
            }
            
            // If still not found, try with space before parentheses
            var templateNameWithSpace = ruleName.replace(/\s*\([^)]+\)/g, ' (x)');
            rule = eaTemplating.specialRulesData[templateNameWithSpace];
            if (rule) {
                return rule;
            }
            
            return null;
        };

    },

    // Function to ensure weapons data is loaded
    ensureWeaponsDataLoaded: function() {
        return new Promise(function(resolve, reject) {
            // Simple check - if we have any weapons loaded, we're good
            if (eaTemplating.weaponsData.weapons && Object.keys(eaTemplating.weaponsData.weapons).length > 50) {
                resolve();
                return;
            }
            
            // Wait for up to 5 seconds for the initial load to complete
            var maxWaitTime = 5000; // 5 seconds
            var checkInterval = 100; // Check every 100ms
            var totalWaitTime = 0;
            
            var waitForLoad = function() {
                if (eaTemplating.weaponsData.weapons && Object.keys(eaTemplating.weaponsData.weapons).length > 50) {
                    resolve();
                    return;
                }
                
                totalWaitTime += checkInterval;
                if (totalWaitTime >= maxWaitTime) {
                    reject('Weapons data failed to load within expected time');
                    return;
                }
                
                setTimeout(waitForLoad, checkInterval);
            };
            
            waitForLoad();
        });
    },

    // Function to generate and display quick reference sheet
    generateQuickReference: function(armyData, unitSections) {
        if (!eaTemplating.templates['quick-reference']) {
            alert('Quick reference template not loaded yet. Please try again in a moment.');
            return;
        }

        eaTemplating.ensureWeaponsDataLoaded().then(function() {
            var quickRefData = {
                fraction: armyData.fraction,
                army: armyData.army,
                unitSections: unitSections
            };

            try {
                var html = eaTemplating.templates['quick-reference'](quickRefData);
                
                var printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
                printWindow.document.write(html);
                printWindow.document.close();
                
                printWindow.focus();
                setTimeout(function() {
                    printWindow.print();
                }, 500);
            } catch (error) {
                alert('Error generating quick reference: ' + error.message);
            }
        }).catch(function(error) {
            alert('Failed to load weapons data. Please try again.');
        });
    },


};
