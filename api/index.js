import server from '../dist/server/server.js';

export default function (request, event) {
  return server.fetch(request, process.env, event);
}
