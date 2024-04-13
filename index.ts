
type Device = 'floor' | 'street';

const TIMEOUT = 50;

const deviceUrl = (device: Device) => {
  const id = device === 'floor' ? Bun.env.FLOOR_ID : Bun.env.STREET_ID;
  return `https://api.nuki.io/smartlock/${id}/action/unlock`
}

const openDoor = async (door: Device) => {
  if (door !== 'floor' && door !== 'street') {
    console.error(`Door ${door} not found`)
    return new Response('Bad request', { status: 400 })
  }

  const url = deviceUrl(door);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Bun.env.NUKI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })

  if (res.ok) {
    console.log(`Opening ${door}`, new Date().toLocaleString('de'))
  } else {
    console.error(res.status, res.statusText)
  }

  return res;
}


const handleRequest = async (request: Request) => {
  if (request.method !== 'GET') {
    return new Response('Bad request', { status: 400 })
  }
  const auth = request.headers.get('Authorization');

  if (auth !== Bun.env.AUTH_KEY) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url);
  const door = searchParams.get('door') as Device | null;
  const timeout = searchParams.get('timeout');

  if (door) {
    const res = await openDoor(door)
    if (!res.ok) {
      return res;
    }

    return new Response(`Opening ${door}`);
  }

  // opening both
  console.log('Opening both doors');
  const res = await openDoor('street');
  if (!res.ok) return res;

  const customTimeout = Number(timeout);
  const time = customTimeout? customTimeout: TIMEOUT;
  
  setTimeout(() => openDoor('floor'), time * 1000);
  return new Response(`Opening doors with timeout of ${time} seconds`);
}

const server = Bun.serve({
  port: 8080,
  fetch: handleRequest
});

console.log(`Listening on localhost:${server.port}`);
