require_relative './support/matchers'
require_relative '../lib/gitlab_monitor'
include ITHAKA

describe "Gitlab Monitor" do
  describe "healthcheck" do
    it 'is up' do
      expect(GitlabMonitor.status.code).to eq('200')
    end
  end
end

