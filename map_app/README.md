Map App
=======

This is the application that runs the google maps app that will display via markers the position of the plane at the patuxant naval air base.

#Downloading Tiles
Since we have to access tiles locally on the flight field the map application will be using tiles that we download into the tiles folder on the internet.
To download the tiles:

   1. Change directory into the tiles folder: ` cd tiles `

   2. Run the following commands in the tiles folder on a Mac OSX terminal or on a Linux command prompt:
      <b> Note you will need cURL to run this. </b>
 
`curl "http://c.tile.openstreetmap.org/18/754[05-30]/1009[70-90].png" -o "#1/754#2/1009#3.png" --create-dirs`
`curl "http://c.tile.openstreetmap.org/17/377[00-24]/504[80-99].png" -o "17/377#1/504#2.png" --create-dirs`
`curl "http://c.tile.openstreetmap.org/16/188[52-58]/252[42-49].png" -o "tiles/16/188#1/252#2.png" --create-dirs`

   <i> If you are testing in SITL you need to download the tiles to allow SITL to run </i>

`curl "http://b.tile.openstreetmap.org/16/599[10-25]/396[45-65].png" -o "tiles/16/599#1/396#2.png" --create-dirs`
`curl "http://a.tile.openstreetmap.org/17/1198[35-55]/793[08-28].png" -o "tiles/17/1198#1/793#2.png" --create-dirs`
`curl "http://a.tile.openstreetmap.org/18/2396[65-90]/1586[28-63].png" -o "tiles/18/2396#1/1586#2.png" --create-dirs`

