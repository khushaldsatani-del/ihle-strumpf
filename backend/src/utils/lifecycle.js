// Whether this process is shutting down (SIGTERM from Render during a deploy or a scale-down). While it is, the
// health check answers 503, so the load balancer sends no new requests here, and open keep-alive connections are
// told to close after their current request.
let draining = false

export const isDraining = () => draining
export const startDraining = () => {
  draining = true
}
