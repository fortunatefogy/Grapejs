// Azure Blob Storage Configuration
type AzureConfig = {
  // Full SAS URL including container name and SAS token
  // Example: https://{account}.blob.core.windows.net/{container}?{sas_token}
  CONTAINER_SAS_URL: string;
  // Set to null to extract container name from the SAS URL
  CONTAINER_NAME: string | null;
};

export const AZURE_CONFIG: AzureConfig = {
  // 🔹 Your Azure Blob container SAS URL (must include container name and SAS token)
  CONTAINER_SAS_URL: "https://cdphsharepointstorage.blob.core.windows.net/images?si=BlobAcess&spr=https&sv=2024-11-04&sr=c&sig=DXRR61RLmJE52qAc8HDq%2FMFqpnzlhhryx86v%2Fd9YwD0%3D",
  
  // Set to null to auto-extract container name from the URL
  // Or specify the container name here if not included in the URL
  CONTAINER_NAME: null // Auto-extract from URL
};
