# Agario Assist
A Chrome extension to make it easier to play agar.io

Install via the [Chrome web store](https://chrome.google.com/webstore/detail/agario-assist/omjghcmcgmlbelimhhcocpogolifaild).

## Features

 - Allows you to zoom out to see more of the map with your mouse scroll wheel
 - Color codes your enemies relative to your size.
    * Red is over twice your size (they can split on you)
    * Orange is bigger than you (they can eat you)
    * Yellow is smaller than you (you can eat them)
    * Green is under half your size (you can split on them)

## How it works

The extension dynamically deobfusicates the game code, injects custom code to enable the extension features, then runs that modified code instead of the normal game code.

The deobfusication code is contained within `lib/esmedic.js`, and the variable renaming is in `src/bandages.js`. An example of what the end result will be (based on what code was live when I last updated the repo) is in `debug/game.js`.

## Feedback and Contributions

I welcome all feedback and pull requests via Github issues. I would prefer you not email me, and if you file a PR please try to keep it small.
