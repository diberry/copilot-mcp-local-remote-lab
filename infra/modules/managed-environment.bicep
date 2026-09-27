param name string
param location string
param tags object
param workspaceId string
@secure()
param workspaceKey string
resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: name
  location: location
  tags: tags
  properties: { appLogsConfiguration: { destination: 'log-analytics', logAnalyticsConfiguration: { customerId: workspaceId, sharedKey: workspaceKey } } }
}
output id string = environment.id
