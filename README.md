# EMT MagicMirror² module

This module shows estimated arrival times for bus lines in Madrid, in [MagicMirror²](https://github.com/MichMich/MagicMirror/).

It uses the official EMT API so, to install this module you will need to register yourself on the EMT OpenData platform [here](http://opendata.emtmadrid.es/Formulario). Once registered, you need to "create an application" to obtain your `clientId` and `passKey`.


## EMT Module Screenshot

![emt screenshot destination](https://github.com/gezeta-id/MMM-emt/raw/master/emt-screenshot-destination.png "EMT screenshot module with destination enable-destination")


## Using the module

To use this module, add it to the modules array in the `config/config.js` file:

````javascript
modules: [
    {
        module: "MMM-emt",
        position: "top_left", // Best results in left or right regions.
        config: {
            // See 'Configuration options' for more information.
        }
    }
]
````

## Configuration options

The following property is required:

| Option                       | Description
| ---------------------------- | -----------
| `busStops`             | List to query about all lines defined. It should be an array of stop codes.

#### EMT authentication options:

These two options are required:

| Option                | Description
| --------------------- | -----------
| `clientId`            | ClientId provided by EMT open-data platform. <br><br> **Default value:** `""`
| `passKey`             | Passkey provided by EMT open-data platform. <br><br>  **Default value:** `""`


#### UI options:

All of these are optional:

| Option                | Description
| --------------------- | -----------
| `highlightInterval`   | Interval, in minutes, that is optimum. Busses in that interval will show highlighted. <br><br> **Possible values:** an array of two values in `0-20` <br> **Default value:** `[5, 10]`
| `updateInterval`      | Time between requests EMT platform in miliseconds. <br><br> **Possible values:** any integer <br> **Default value:** `60 * 1000` (one minute)
| `showDestination`     | Show the bus destination. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`

