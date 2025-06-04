import * as THREE from "three";
import { PilotHeadType } from "../components/parts/pilot-head";

const defaultGlider = {
    wingColor1: 'orange',
    wingColor2: 'green',
    breakColor: '#ffffff',
    lineFrontColor: '#ffffff',
    lineBackColor: '#ffffff',
    inletsColor: '#333333',
    numeroCajones: 35
}

const defaultHead = {
    helmetColor: '#ffff00',
    headType: PilotHeadType.Default
}

const defaultPilot = {
    head: {
        ...defaultHead
    }
}

const tandems = [
    {
        pg: {
            glider: {
                ...defaultGlider
            },
            pilot: {
                pilot: {
                    ...defaultPilot
                },
                passenger: {
                    head: { ...defaultHead },
                    suitColor: 'red', suitColor2: 'green'
                }
            },
        },
        position: new THREE.Vector3(6837, 850, -535)
    }
];


const paragliders = [
    {
        pg: {
            glider: {
                wingColor1: 'red',
                wingColor2: '#b100cd',
                inletsColor: '#333333',
                numeroCajones: 35
            },
            pilot: {
                ...defaultPilot
            }
        },
        position: new THREE.Vector3(6827, 860, -555)
    },
    {
        pg: {
            glider: {
                wingColor1: 'yellow',
                wingColor2: '#b100cd',
                inletsColor: '#333333',
                numeroCajones: 50
            },
            pilot: {
                ...defaultPilot
            }
        },
        position: new THREE.Vector3(6727, 780, -555)
    },
    {
        pg: {
            glider: {
                wingColor1: 'black',
                wingColor2: 'white',
                inletsColor: '#333333',
                numeroCajones: 40
            },
            pilot: {
                ...defaultPilot
            }
        },
        position: new THREE.Vector3(6777, 920, -535)
    },
    {
        // fabio
        pg: {
            glider: {
                wingColor1: 'purple',
                wingColor2: '#b100cd',
                inletsColor: '#333333',
                numeroCajones: 40
            },
            pilot: {
                ...defaultPilot
            }
        },
        position: new THREE.Vector3(6777, 920, -535)
    }
];

export { paragliders, tandems };  