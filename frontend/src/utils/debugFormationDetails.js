/**
 * Utilitaire de debug pour les détails de formation
 */

export const debugFormationId = (id) => {
  console.group('🔍 Debug Formation ID');
  console.log('ID from URL params:', id);
  console.log('ID type:', typeof id);
  console.log('ID length:', id ? id.length : 'undefined');
  console.log('Is valid MongoDB ObjectId format?', /^[0-9a-fA-F]{24}$/.test(id));
  console.groupEnd();
};

export const debugApiResponse = (response, context) => {
  console.group(`📡 Debug API Response - ${context}`);
  console.log('Full response:', response);
  console.log('Response status:', response.status);
  console.log('Response data:', response.data);
  
  if (response.data) {
    console.log('Data structure check:');
    console.log('- Has "success" field:', 'success' in response.data);
    console.log('- Has "data" field:', 'data' in response.data);
    console.log('- Direct data type:', typeof response.data);
    console.log('- Nested data type:', typeof response.data?.data);
    
    if (response.data?.data) {
      console.log('Formation data found:', response.data.data);
    } else if (response.data && !response.data.success) {
      console.log('Direct formation data:', response.data);
    }
  }
  console.groupEnd();
};

export const debugFormationStructure = (formation) => {
  if (!formation) {
    console.warn('❌ Formation is null/undefined');
    return;
  }
  
  console.group('📚 Debug Formation Structure');
  console.log('Formation object:', formation);
  console.log('Required fields check:');
  console.log('- _id:', formation._id);
  console.log('- titre:', formation.titre);
  console.log('- description:', formation.description);
  console.log('- prix:', formation.prix);
  console.log('- statut:', formation.statut);
  console.log('- active:', formation.active);
  console.groupEnd();
};

export const testFormationApi = async (id) => {
  console.group('🧪 Testing Formation API');
  
  try {
    // Test direct fetch
    const response = await fetch(`http://localhost:5000/api/formations/${id}`);
    const data = await response.json();
    
    console.log('Direct fetch result:');
    console.log('- Status:', response.status);
    console.log('- Data:', data);
    
    if (response.ok) {
      console.log('✅ API call successful');
      return data;
    } else {
      console.log('❌ API call failed');
      return null;
    }
  } catch (error) {
    console.error('❌ API test failed:', error);
    return null;
  } finally {
    console.groupEnd();
  }
};
