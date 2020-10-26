require 'ithaka_core/junit_formatter'
require 'bundler'

Bundler.require(:default)

APP_NAME = 'gitlab-monitor'

default_env_configs = {
    app_url: APP_NAME,
    environment: 'test',
    alias_locations: {}
}
local_env_configs = if File.exists?('env_config.json')
                      File.open('env_config.json', 'r') { |file| JSON.parse(file.read) }
                    else
                      {}
                    end

env_config = default_env_configs.merge(local_env_configs)

APP_URL = ENV['APP_URL'] || env_config[:app_url]
ENVIRONMENT = ENV['ENVIRONMENT'] || env_config[:environment]
ALIAS_LOCATIONS = ENV['ALIASLOCATIONS'] ? JSON.parse(URI.unescape(ENV['ALIASLOCATIONS'])) : env_config[:alias_locations]

ITHAKA::ServiceLocation.configure do |config|
  config.alias_list = {APP_NAME => APP_URL}.merge ALIAS_LOCATIONS
  config.environment = ENVIRONMENT
  puts "Alias name/location: #{APP_URL}"
  puts "Environment: #{ENVIRONMENT}"
  puts "Testing against service at: #{ITHAKA::ServiceLocation.get_host(APP_NAME)}"
end


RSpec.configure do |config|

  # Color console output
  config.tty = true

  # Providing access to spec context from within spec
  config.before(:each) do |spec|
    @spec = spec.metadata
  end

  # Prohibit running no_prod tests against PROD
  config.before(:example, :no_prod) do
    skip('Environment is PROD and this test is marked ":no_prod"') if ENVIRONMENT == 'prod'
  end

  # Prohibit running no_test tests against TEST
  config.before(:example, :no_test) do
    skip('Environment is TEST and this test is marked ":no_test"') if ENVIRONMENT == 'test'
  end

end
