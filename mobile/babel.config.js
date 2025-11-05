// mobile/babel.config.js
module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            ['babel-plugin-module-resolver', {
                root: ['./'],
                alias: { '@': './' },
                extensions: ['.tsx', '.ts', '.js', '.json']
            }],
            'react-native-worklets/plugin', // MUST be last
        ],
    };
};
