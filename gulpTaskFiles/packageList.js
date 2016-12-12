const fs   = require('fs');
const path = require('path');

const { PATHS } = require('./CONSTANTS');

let packages = [];

function refreshList() {
    const oldPackages = packages;

    // get the list of folders
    const folders = fs.readdirSync(PATHS.src.root)
                      .filter(file => fs.statSync(path.join(PATHS.src.root, file)).isDirectory());

    // look for our expected folders
    if (folders.includes('js') ||
        folders.includes('css')) {
        // found - so we're dealing with a single package
        packages = [
            {
                name: 'root',
                src: PATHS.src.root,
                dest: PATHS.build.root,
                isLib: fs.existsSync(`${PATHS.src.root}/is.library`),
            },
        ];
    } else {
        // not found - we're dealing with multiple packages!
        packages = folders.map((name) => {
            const src = `${PATHS.src.root}/${name}`;
            const dest = `${PATHS.build.root}/${name}`;
            const isLib = fs.existsSync(`${src}/is.library`);
            return {
                name,
                src,
                dest,
                isLib,
            };
        });
    }

    // check for changes
    const changed = oldPackages.some(op => !packages.find(p => op.name === p.name));
    if (changed) {
        console.log('Found the following packages: ', packages.map(p => p.name).join(', '));
    }
    return changed;
}

// get the list of packages
refreshList();

module.exports = {
    get() {
        return packages;
    },

    refresh: refreshList,
};
