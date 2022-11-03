import WebSocket, { WebSocketServer } from 'ws';

import osc from 'osc';

var oscPort = new osc.UDPPort({
    remoteAddress: 'localhost',
    remotePort: 5000,
    metadata: true
});

oscPort.open();

oscPort.on('ready', function() {
    oscPort.send({
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

    oscPort.send({
        // Tags this bundle with a timestamp that is 60 seconds from now.
        // Note that the message will be sent immediately;
        // the receiver should use the time tag to determine
        // when to act upon the received message.
        timeTag: osc.timeTag(0),
    
        packets: [
            {
                address: "/list-set/calm_voice_1",
                args: [
                    ...[1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0 ].map((i) => {
                        return {
                            type: "f",
                            value: (Math.random() > .5),
                        }
                    })
                ]
            },
            {
                address: "/list-set/calm_voice_2",
                args: [
                    ...[1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0 ].map((i) => {
                        return {
                            type: "f",
                            value: (Math.random() > .6),
                        }
                    })
                ]
            },
            {
                address: "/list-set/calm_voice_3",
                args: [
                    ...[1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0 ].map((i) => {
                        return {
                            type: "f",
                            value: (Math.random() > .8),
                        }
                    })
                ]
            }
        ]
    });
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
      ws.on('message', (data) => {
        console.log('got %s', data);
    if (data.includes("birth")) {
        let port = getPort(data);

        if (!port) {
            console.log("couldn't find port in message");

            return;
        }

        oscPort.send({
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

        oscPort.send({
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

        oscPort.send({
            address: '/tweak',
            args: [
                {
                    type: 'f',
                    value: parseFloat(val),
                }
            ]
        });
    } else if ((''+data).startsWith("list-set")) {
        let components = (''+data).split(' ');

        let values = components.slice(2);
        
        oscPort.send({
            address: `/list-set/${components[1]}`,
            args: [
                ...values.map(i => {
                    return {
                            type: "f",
                            value: parseInt(i)
                        }
                })
            ]
        })
    }  else if ((''+data).startsWith("value-set")) {
        let components = (''+data).split(' ');

        let name = components[1]

        let value = components[2];
        
        oscPort.send({
            address: `/value-set`,
            args: [
                {
                    type: "s",
                    value: name,
                },
                {
                    type: "f",
                    value: value
                }
            ]
        })
    }
  })

  ws.send('hello');
});