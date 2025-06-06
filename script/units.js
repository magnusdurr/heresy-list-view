var units = {
    errors: [],

    formatUnits: function (data) {
        unitSections = [];

        typeSort = function (type) {
            switch (type) {
                case "CH": return 0;
                case "INF": return 1;
                case "LV": return 2;
                case "AV": return 3;
                case "H-AV": return 4;
                case "WE": return 5;
                case "AC": return 6;
                case "AC/WE": return 7;
                case "SC": return 8;
                default: return 9;
            }
        }

        data.units.forEach(function (unitSection) {
            const parsedUnitsMap = unitSection.units.reduce((map, unit) => {
                const split = unit.split('|');
                map.set(split[0], split.slice(1)); // Use the name as the key and variants as the value
                return map;
            }, new Map());

            $.ajax("lists/" + unitSection.from, {
                async: false,
                success: function (units) {
                    units.forEach(function (section) {
                        section.unit = section.unit
                            .filter(function (unit) {
                                return parsedUnitsMap.keys().toArray().includes(unit.name)
                            })
                            .map(function (unit) {
                                if (unit.variants !== undefined &&
                                    parsedUnitsMap.get(unit.name).length > 0 &&
                                    parsedUnitsMap.get(unit.name).length !== unit.variants.length) {

                                    unit.variants = unit.variants.filter(function (variant) {
                                        return parsedUnitsMap.get(unit.name).includes(variant.name)
                                    });
                                }

                                return unit
                            });

                        section.unit.sort(function (a, b) {
                            typeSortNumber = typeSort(a.type) - typeSort(b.type)

                            if (typeSortNumber !== 0) {
                                return typeSortNumber
                            } else {
                                return a.name.localeCompare(b.name)
                            }
                        });
                    });

                    unitSections.push(units);
                }
            });
        });

        return unitSections;
    }
};
