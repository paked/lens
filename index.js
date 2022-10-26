import WebSocket, { WebSocketServer } from 'ws';

import osc from 'osc';

var udpPort = new osc.UDPPort({
    remoteAddress: 'localhost',
    remotePort: 5000,
    metadata: true
});

udpPort.open();

udpPort.on('ready', function() {
    udpPort.send({
        address: '/test',
        args: [
            {
                type: "s",
                value: "default"
            },
            {
                type: "i",
                value: 100
            }
        ]
    })
})

import express from 'express';

const app=express();
app.use(express.json({ extended: false}));
app.use(express.static('public'));

var port = process.env.PORT || 3000;

const wss = new WebSocketServer({ server: app.listen(port)});

function getPort(msg) {
    let ports = ['MODEM', 'BEATS', 'BASS', 'CASSETTE', 'PADS'];

    for (let i = 0; i < ports.length; i++) {
        if (msg.includes(ports[i])) {
            return ports[i];
        }
    }

    return undefined;
}

wss.on('connection', (ws) => {
    console.log('connected!');
  ws.on('message', (data) => {
    console.log('got %s', data);

    if (data.includes("birth")) {
        let port = getPort(data);

        if (!port) {
            console.log("couldn't find port in message");

            return;
        }

        udpPort.send({
            address: '/birth',
            args: [
                {
                    type: 's',
                    value: port,
                }
            ]
        })
    } else if (data.includes("murder")) {
        let port = getPort(data);

        if (!port) {
            console.log("couldn't find port in message");

            return;
        }

        udpPort.send({
            address: '/murder',
            args: [
                {
                    type: 's',
                    value: port,
                }
            ]
        })
    } else if (('' +data).startsWith("tweak")) {
        let [_, val] = (data+'').split(' ');

        udpPort.send({
            address: '/tweak',
            args: [
                {
                    type: 'f',
                    value: parseFloat(val),
                }
            ]
        });
    }
  });

  ws.send('hello');
});