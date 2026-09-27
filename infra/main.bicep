targetScope = 'subscription'

@minLength(1)
param environmentName string
param location string = deployment().location
@allowed(['warm', 'cold'])
param scalingProfile string = 'warm'
param imageName string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
@minLength(1)
param allowedOrigin string = 'https://copilot.local'
@secure()
param mcpBearerToken string = ''

var token = toLower(uniqueString(subscription().id, environmentName))
var tags = { 'azd-env-name': environmentName, purpose: 'copilot-mcp-learning-lab' }

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

module logs 'modules/log-analytics.bicep' = {
  scope: resourceGroup
  name: 'logs'
  params: { name: 'log-${token}', location: location, tags: tags }
}
module registry 'modules/container-registry.bicep' = {
  scope: resourceGroup
  name: 'registry'
  params: { name: 'acr${token}', location: location, tags: tags }
}
module identity 'modules/identity.bicep' = {
  scope: resourceGroup
  name: 'identity'
  params: { name: 'id-${environmentName}', location: location, tags: tags, registryId: registry.outputs.id }
}
module managedEnvironment 'modules/managed-environment.bicep' = {
  scope: resourceGroup
  name: 'environment'
  params: { name: 'cae-${environmentName}', location: location, tags: tags, workspaceId: logs.outputs.customerId, workspaceKey: logs.outputs.sharedKey }
}
module app 'modules/container-app.bicep' = {
  scope: resourceGroup
  name: 'app'
  params: {
    name: 'ca-${environmentName}'
    location: location
    tags: union(tags, { 'azd-service-name': 'mcp' })
    environmentId: managedEnvironment.outputs.id
    identityId: identity.outputs.id
    registryServer: registry.outputs.loginServer
    imageName: imageName
    minReplicas: scalingProfile == 'warm' ? 1 : 0
    allowedOrigin: allowedOrigin
    mcpBearerToken: mcpBearerToken
  }
}

output AZURE_RESOURCE_GROUP string = resourceGroup.name
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = registry.outputs.loginServer
output SERVICE_MCP_URI string = 'https://${app.outputs.fqdn}'
