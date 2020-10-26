RSpec::Matchers.define :return_a_status_code_of do |expected|
  match do |actual|
    actual.code == expected
  end
end
