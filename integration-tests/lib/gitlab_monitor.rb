module GitlabMonitor
  extend self

  @rest = ITHAKA::RestCaller
  @service_url = ITHAKA::ServiceLocation.get_host(APP_NAME)

  def status
    call_params = {method: 'get', host: @service_url, path: '/healthcheck'}
    @rest.call(call_params)
  end
end
