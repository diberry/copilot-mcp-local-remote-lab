targetScope = 'subscription'

@minLength(1)
param environmentName string
param location string = deployment().location
@allowed(['warm', 'cold'])
param scalingProfile string = 'warm'
param gatewayImageName string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
param runtimeImageName string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
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
module gatewayIdentity 'modules/identity.bicep' = {
  scope: resourceGroup
  name: 'gateway-identity'
  params: { name: 'id-${environmentName}-gateway', location: location, tags: tags, registryId: registry.outputs.id }
}
module runtimeIdentity 'modules/identity.bicep' = {
  scope: resourceGroup
  name: 'runtime-identity'
  params: { name: 'id-${environmentName}-runtime', location: location, tags: tags, registryId: registry.outputs.id }
}
module managedEnvironment 'modules/managed-environment.bicep' = {
  scope: resourceGroup
  name: 'environment'
  params: { name: 'cae-${environmentName}', location: location, tags: tags, workspaceId: logs.outputs.customerId, workspaceKey: logs.outputs.sharedKey }
}
module runtime 'modules/plugin-runtime-app.bicep' = {
  scope: resourceGroup
  name: 'plugin-runtime'
  params: {
    name: 'ca-${environmentName}-runtime'
    location: location
    tags: union(tags, { 'azd-service-name': 'runtime' })
    environmentId: managedEnvironment.outputs.id
    identityId: runtimeIdentity.outputs.id
    registryServer: registry.outputs.loginServer
    imageName: runtimeImageName
    minReplicas: scalingProfile == 'warm' ? 1 : 0
  }
}
module gateway 'modules/container-app.bicep' = {
  scope: resourceGroup
  name: 'company-mcp-gateway'
  params: {
    name: 'ca-${environmentName}-gateway'
    location: location
    tags: union(tags, { 'azd-service-name': 'gateway' })
    environmentId: managedEnvironment.outputs.id
    identityId: gatewayIdentity.outputs.id
    registryServer: registry.outputs.loginServer
    imageName: gatewayImageName
    minReplicas: scalingProfile == 'warm' ? 1 : 0
    allowedOrigin: allowedOrigin
    mcpBearerToken: mcpBearerToken
    pluginRuntimeUrl: 'https://${runtime.outputs.fqdn}/internal/mcp'
  }
}

output AZURE_RESOURCE_GROUP string = resourceGroup.name
output AZURE_CONTAINER_REGISTRY_ENDPOINT string = registry.outputs.loginServer
output SERVICE_GATEWAY_URI string = 'https://${gateway.outputs.fqdn}'
output ACA_RESOURCE_GROUP string = resourceGroup.name
output ACA_GATEWAY_APP_NAME string = 'ca-${environmentName}-gateway'
output ACA_RUNTIME_APP_NAME string = 'ca-${environmentName}-runtime'
output MCP_ENDPOINT_URL string = 'https://${gateway.outputs.fqdn}/mcp'
output PLUGIN_RUNTIME_INTERNAL_FQDN string = runtime.outputs.fqdn
output EXPERIMENT_ORIGIN string = allowedOrigin
output EXPERIMENT_SCALING_PROFILE string = scalingProfile
output EXPERIMENT_STORAGE_MODE string = 'memory'
