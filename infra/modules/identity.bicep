param name string
param location string
param tags object
param registryId string
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = { name: name, location: location, tags: tags }
resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: last(split(registryId, '/'))
}
resource acrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registryId, identity.id, 'AcrPull')
  scope: registry
  properties: { principalId: identity.properties.principalId, principalType: 'ServicePrincipal', roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') }
}
output id string = identity.id
