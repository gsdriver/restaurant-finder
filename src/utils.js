//
// Utility functionals
//

/*
 * Exported functions
 */

module.exports = {
    // Cache functions
    ReadLocation: function (location) {
        // If the location is a ZIP code, spell it out
        var retval = location;

        if ((location.length == 5) && (parseInt(location) > 0))
        {
            // This is a ZIP code
            retval = location.substring(0,1) + " " + location.substring(1,2) + " " + location.substring(2,3) + " " +
                        location.substring(3,4) + " " + location.substring(4,5);
        }

        return retval;
    }
};

